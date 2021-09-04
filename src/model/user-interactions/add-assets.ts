import { action, Action, thunk, Thunk } from "easy-peasy";
import { readArraybuffer } from "../../utils";
import { IPytchAppModel } from "..";
import { addAssetToProject } from "../../database/indexed-db";

export type Failure = {
  fileName: string;
  reason: string;
};

type ScalarState =
  | { status: "idle" }
  | { status: "awaiting-user-choice" }
  | { status: "trying-to-add" };

type ScalarStatus = ScalarState["status"];

type State =
  | ScalarState
  | { status: "showing-failures"; failures: Array<Failure> };

export type IAddAssetsInteraction = State & {
  setScalar: Action<IAddAssetsInteraction, ScalarStatus>;
  setFailed: Action<IAddAssetsInteraction, Array<Failure>>;
  launch: Thunk<IAddAssetsInteraction>;
  tryAdd: Thunk<IAddAssetsInteraction, FileList, any, IPytchAppModel>;
  dismiss: Thunk<IAddAssetsInteraction>;
};

// Convert (eg) ProgressUpdate error for unreadable file into something
// a bit more human-friendly:
const simpleReadArraybuffer = async (file: File) => {
  try {
    return await readArraybuffer(file);
  } catch (e) {
    throw new Error("problem reading file");
  }
};

export const addAssetsInteraction: IAddAssetsInteraction = {
  status: "idle",

  setScalar: action((_state, status) => ({ status })),

  setFailed: action((_state, failures) => ({
    status: "showing-failures",
    failures,
  })),

  launch: thunk((actions) => actions.setScalar("awaiting-user-choice")),

  dismiss: thunk((actions) => actions.setScalar("idle")),

  tryAdd: thunk(async (actions, files, helpers) => {
    // It's possible this will change while we're working, e.g., if the
    // user hits "back" and then opens a different project.  Make sure
    // we add all assets to the project which was live when the thunk
    // was launched.
    const projectId = helpers.getStoreState().activeProject.project.id;

    actions.setScalar("trying-to-add");

    let failedAdds: Array<Failure> = [];

    for (const file of files) {
      try {
        const fileBuffer = await simpleReadArraybuffer(file);
        await addAssetToProject(projectId, file.name, file.type, fileBuffer);
      } catch (e) {
        console.error("tryAdd():", e);
        failedAdds.push({ fileName: file.name, reason: e.message });
      }
    }

    // Check the active project now is the same one we worked with.
    const liveProjectId = helpers.getStoreState().activeProject.project.id;
    if (liveProjectId !== projectId) {
      console.log(
        `assets added to project ${projectId}` +
          ` but now active is project ${liveProjectId}; bailing`
      );
      return;
    }

    await helpers.getStoreActions().activeProject.syncAssetsFromStorage();

    if (failedAdds.length > 0) {
      actions.setFailed(failedAdds);
    } else {
      actions.setScalar("idle");
    }
  }),
};
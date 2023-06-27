import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
import { batch } from "react-redux";
import raw from "raw.macro";

import {
  addRemoteAssetToProject,
  allProjectSummaries,
  copyProject,
  createNewProject,
  deleteManyProjects,
  renameProject,
} from "../database/indexed-db";
import { assertNever, failIfNull, withinApp } from "../utils";

import { TutorialId } from "./tutorial";
import { IPytchAppModel } from ".";
import { ProjectId, ITrackedTutorial } from "./project-core";
import { PytchProgramOps } from "./pytch-program";

export type ProjectTemplateKind = "bare-bones" | "with-sample-code";

export interface ICreateProjectDescriptor {
  name: string;
  template: ProjectTemplateKind;
}

export interface ICopyProjectDescriptor {
  sourceProjectId: ProjectId;
  nameOfCopy: string;
}

export interface ITrackedTutorialRef {
  slug: TutorialId;
  activeChapterIndex: number;
}

export interface ITutorialTrackingUpdate {
  projectId: ProjectId;
  chapterIndex: number;
}

// Currently, the "summary" property is only used for tutorial-following
// project, but the idea is that the user will in due course be able to
// provide a summary.
//
export interface IProjectSummary {
  id: ProjectId;
  name: string;
  summary?: string;
  trackedTutorial?: ITrackedTutorial;
}

export interface IDisplayedProjectSummary {
  summary: IProjectSummary;
  isSelected: boolean;
}

export enum LoadingState {
  Idle,
  Pending,
  Succeeded,
  Failed,
}

export interface IProjectCollection {
  loadingState: LoadingState;
  available: Array<IDisplayedProjectSummary>;

  loadingPending: Action<IProjectCollection>;
  loadingSucceeded: Action<IProjectCollection>;
  setAvailable: Action<IProjectCollection, Array<IProjectSummary>>;
  loadSummaries: Thunk<IProjectCollection>;
  addProject: Action<IProjectCollection, IProjectSummary>;
  createNewProject: Thunk<IProjectCollection, ICreateProjectDescriptor>;
  requestCopyProjectThenResync: Thunk<
    IProjectCollection,
    ICopyProjectDescriptor,
    any,
    IPytchAppModel,
    Promise<ProjectId>
  >;
  requestDeleteManyProjectsThenResync: Thunk<
    IProjectCollection,
    Array<ProjectId>
  >;
  requestRenameProjectThenResync: Thunk<IProjectCollection, IProjectSummary>;

  availableSelectedIds: Computed<IProjectCollection, Array<number>>;
  toggleProjectSelected: Action<IProjectCollection, ProjectId>;
  clearAllSelected: Action<IProjectCollection>;

  updateTutorialChapter: Action<IProjectCollection, ITutorialTrackingUpdate>;
}

export const projectCollection: IProjectCollection = {
  loadingState: LoadingState.Idle,
  available: [],

  loadingPending: action((state) => {
    state.loadingState = LoadingState.Pending;
  }),
  loadingSucceeded: action((state) => {
    state.loadingState = LoadingState.Succeeded;
  }),

  setAvailable: action((state, summaries) => {
    state.available = summaries.map((summary) => ({
      summary,
      isSelected: false,
    }));
  }),

  loadSummaries: thunk(async (actions) => {
    actions.loadingPending();
    const summaries = await allProjectSummaries();
    batch(() => {
      actions.setAvailable(summaries);
      actions.loadingSucceeded();
    });
  }),

  addProject: action((state, projectSummary) => {
    // TODO: Assert that new project's ID is not already known to us?
    console.log(
      "IProjectCollection.addProject(): adding",
      projectSummary.name,
      projectSummary.summary
    );
    state.available.push({ summary: projectSummary, isSelected: false });
  }),

  createNewProject: thunk(async (actions, descriptor) => {
    // The content of skeleton-project.py is read at build time.  NOTE:
    // For live-reload development via 'npm start', if you edit the
    // Python code, you must force a re-build of this present file.
    // This can be done, for example, by adding a few junk characters at
    // the end of this comment.  See
    //
    //     https://github.com/pveyes/raw.macro/#usage
    //
    // for details.

    const templateContent = (() => {
      switch (descriptor.template) {
        case "bare-bones":
          return {
            codeText: "import pytch\n",
            assets: ["python-logo.png"],
          };
        case "with-sample-code":
          return {
            codeText: raw("../assets/skeleton-project.py"),
            assets: ["green-burst.jpg", "python-logo.png"],
          };
        default:
          return assertNever(descriptor.template);
      }
    })();

    const program = PytchProgramOps.fromPythonCode(templateContent.codeText);
    const newProject = await createNewProject(
      descriptor.name,
      undefined, // summary
      undefined, // tracked tutorial ref
      program
    );

    // These are fetched at runtime:
    const skeletonAssetFilenames = templateContent.assets;
    await Promise.all(
      skeletonAssetFilenames.map((basename) =>
        addRemoteAssetToProject(newProject.id, withinApp(`/assets/${basename}`))
      )
    );

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
    return newProject;
  }),

  requestCopyProjectThenResync: thunk(async (actions, saveAsDescriptor) => {
    const newId = await copyProject(
      saveAsDescriptor.sourceProjectId,
      saveAsDescriptor.nameOfCopy
    );

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);

    return newId;
  }),

  requestDeleteManyProjectsThenResync: thunk(async (actions, projectIds) => {
    await deleteManyProjects(projectIds);
    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
  }),

  requestRenameProjectThenResync: thunk(async (actions, projectSummary) => {
    await renameProject(projectSummary.id, projectSummary.name);
    // TODO: Do something with return value?
    //
    // Can be zero if the given ID was not found, or if we tried to
    // "rename" the project to its current name.

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
  }),

  availableSelectedIds: computed((state) =>
    state.available
      .filter((project) => project.isSelected)
      .map((project) => project.summary.id)
  ),

  toggleProjectSelected: action((state, projectId) => {
    const index = state.available.findIndex(
      (project) => project.summary.id === projectId
    );
    if (index === -1) {
      console.error(`could not find project with id ${projectId}`);
      return;
    }
    state.available[index].isSelected = !state.available[index].isSelected;
  }),

  clearAllSelected: action((state) => {
    state.available.forEach((project) => {
      project.isSelected = false;
    });
  }),

  updateTutorialChapter: action((state, trackingUpdate) => {
    const targetProjectId = trackingUpdate.projectId;
    const project = failIfNull(
      state.available.find((p) => p.summary.id === targetProjectId),
      `could not find project ${targetProjectId} to update`
    );
    const trackedTutorial = failIfNull(
      project.summary.trackedTutorial,
      `project ${targetProjectId} is not tracking a tutorial`
    );

    trackedTutorial.activeChapterIndex = trackingUpdate.chapterIndex;
  }),
};

// Additional commands for testing Pytch.

import "cypress-file-upload";
import "cypress-wait-until";

import { IAceEditor } from "react-ace/lib/types";
import {
  stageHalfHeight,
  stageHalfWidth,
  stageHeight,
  stageWidth,
} from "../../src/constants";
import { DexieStorage } from "../../src/database/indexed-db";
import { ProjectId } from "../../src/model/project-core";

const ArrayBufferFromString = (strData: string) => {
  const data = new Uint8Array(strData.length);
  for (let i = 0; i < data.byteLength; ++i) {
    data[i] = strData.charCodeAt(i);
  }
  return data.buffer;
};

// TODO: I'm not 100% sure I'm using Cypress correctly here, considering
// the mixture of promises and functions explicitly returning promises.
// Seems to be working, but would be good to actually understand what's
// going on.
const addAssetFromFixture = (
  db: DexieStorage,
  projectId: ProjectId,
  basename: string,
  mimeType: string
) => {
  cy.fixture(`sample-project-assets/${basename}`, "binary").then(
    (strData: string) => {
      const data = ArrayBufferFromString(strData);
      return db.addAssetToProject(projectId, basename, mimeType, data);
    }
  );
};

const resetDatabaseDefaults: Required<ResetDatabaseOptions> = {
  extraAssets: [],
  extraProjectNames: [],
  extraWindowActions: [],
};

Cypress.Commands.add("pytchResetDatabase", (options?: ResetDatabaseOptions) => {
  let effectiveOptions = Object.assign({}, resetDatabaseDefaults);
  Object.assign(effectiveOptions, options);

  cy.visit("/").then(async (window) => {
    const db = (window as any).PYTCH_CYPRESS.PYTCH_DB as DexieStorage;
    (window as any).PYTCH_CYPRESS.instantDelays = true;
    await db.dangerDangerDeleteEverything();

    effectiveOptions.extraWindowActions.forEach((a) => a(window));

    const allProjectNames = [
      "Test seed project",
      ...effectiveOptions.extraProjectNames,
    ];
    const projectSummaries = await Promise.all(
      allProjectNames.map((name) => db.createNewProject(name))
    );
    const projectSummary = projectSummaries[0];
    (window as any).PYTCH_CYPRESS.nonExistentProjectId = projectSummary.id - 1;

    const allFixtureAssets = [
      { name: "red-rectangle-80-60.png", mimeType: "image/png" },
      { name: "sine-1kHz-2s.mp3", mimeType: "audio/mpeg" },
      ...effectiveOptions.extraAssets,
    ];

    for (const { name, mimeType } of allFixtureAssets) {
      addAssetFromFixture(db, projectSummary.id, name, mimeType);
    }
  });
});

Cypress.Commands.add(
  "pytchExactlyOneProject",
  (resetDatabaseOptions?: ResetDatabaseOptions) => {
    cy.pytchResetDatabase(resetDatabaseOptions);
    cy.contains("My projects").click();
    cy.contains("Test seed project").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
  }
);

Cypress.Commands.add("pytchOpenProject", (name: string) => {
  cy.contains("My projects");
  cy.contains(name).click();

  // Look for an essentially arbitrary element which should be present
  // once the IDE has rendered:
  cy.get("button").contains("Save");

  // And also wait for the loading to complete:
  cy.get(".ReadOnlyOverlay").should("not.exist");
});

Cypress.Commands.add(
  "pytchTryUploadZipfiles",
  (zipBasenames: Array<string>) => {
    cy.visit("/");
    cy.contains("My projects").click();
    cy.get("button").contains("Upload").click();
    const filenames = zipBasenames.map(
      (basename) => `project-zipfiles/${basename}`
    );
    cy.get(".form-control-file").attachFile(filenames);
    cy.get(".modal-footer").contains("Upload").click();
    cy.get(".modal-footer").should("not.exist");
  }
);

Cypress.Commands.add(
  "pytchProjectNamesShouldDeepEqual",
  (expectedNames: Array<string>) =>
    cy.get(".project-name").should(($spans) => {
      const gotNames = $spans.toArray().map((span) => span.innerText);
      expect(gotNames).deep.equal(expectedNames);
    })
);

Cypress.Commands.add("pytchHomeFromIDE", () => {
  cy.get('button *[aria-label="Home"]').click();
  cy.contains("Pytch is a bridge");
});

Cypress.Commands.add("pytchSwitchProject", (name: string) => {
  cy.pytchHomeFromIDE();
  cy.contains("My projects").click();
  cy.pytchOpenProject(name);
});

const createTutorialProject = (
  tutorialMatch: string,
  buttonContent: string
) => {
  cy.pytchResetDatabase();
  cy.contains("Tutorials").click();
  cy.contains(tutorialMatch)
    .parent()
    .within(() => {
      cy.contains(buttonContent).click();
    });

  // More/less as per pytchOpenProject() above, except don't let it get
  // fooled by the buttons on the tutorials page:
  cy.contains("images and sounds");
  cy.get(".ReadOnlyOverlay").should("not.exist");
};

Cypress.Commands.add(
  "pytchProjectFollowingTutorial",
  (tutorialMatch: string = "Boing") =>
    createTutorialProject(tutorialMatch, "Learn how to make")
);

Cypress.Commands.add(
  "pytchProjectDemonstratingTutorial",
  (tutorialMatch: string = "Boing") =>
    createTutorialProject(tutorialMatch, "Try this project")
);

Cypress.Commands.add(
  "pytchShouldShowAssets",
  (expectedNames: Array<string>) => {
    cy.get(".InfoPanel .nav-link")
      .contains("Images and sounds")
      .should("have.class", "active");
    cy.get(".AssetCard .card-header code").then(($codes) => {
      const orderedExpectedNames = [...expectedNames];
      orderedExpectedNames.sort();
      const gotNames = $codes.toArray().map((c) => c.innerText);
      gotNames.sort();
      expect(gotNames).to.eql(orderedExpectedNames);
    });
  }
);

const allSpaces = new RegExp("^ *$");
const initialSpaces = new RegExp("^ *");
const deIndent = (rawCode: string): string => {
  const allLines = rawCode.split("\n");

  if (allLines[0] !== "") {
    throw Error("need empty first line of code");
  }
  const nLines = allLines.length;
  if (!allSpaces.test(allLines[nLines - 1])) {
    throw Error("need all-spaces last line of code");
  }

  const lines = allLines.slice(1, nLines - 1);

  const nonBlankLines = lines.filter((line) => !allSpaces.test(line));
  const nonBlankIndents = nonBlankLines.map(
    (line) => initialSpaces.exec(line)![0].length
  );
  const minNonBlankIndent = Math.min(...nonBlankIndents);

  const strippedLines = lines.map((line) => line.substring(minNonBlankIndent));
  return strippedLines.join("\n") + "\n";
};

// Pick out the editor interface stored by the app.
const aceEditorFromWindow = (window: any): IAceEditor =>
  (window as any).PYTCH_CYPRESS.ACE_CONTROLLER;

Cypress.Commands.add("pytchFocusEditor", () => {
  cy.window().then((window) => {
    aceEditorFromWindow(window).focus();
  });
});

Cypress.Commands.add("pytchSetCodeWithDeIndent", (indentedCodeText: string) => {
  const codeText = deIndent(indentedCodeText);
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    aceEditor.setValue(codeText);
    aceEditor.clearSelection();
    aceEditor.gotoLine(0, 0, true);
  });
});

Cypress.Commands.add("pytchBuild", () => {
  cy.get(".GreenFlag").click();
});

Cypress.Commands.add("pytchBuildCode", (rawCodeText: string) => {
  cy.pytchSetCodeWithDeIndent(rawCodeText);
  cy.contains("Images and sounds").click();
  cy.pytchBuild();
});

Cypress.Commands.add("pytchCodeTextShouldEqual", (expectedCode: string) => {
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    expect(aceEditor.getValue()).to.equal(expectedCode);
  });
});

Cypress.Commands.add("pytchCodeTextShouldContain", (match: string) => {
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    expect(aceEditor.getValue()).to.contain(match);
  });
});

const getStdoutElement = () => {
  cy.get(".nav-item").contains("Output").click();
  return cy.get(".SkulptStdout");
};

Cypress.Commands.add("pytchStdoutShouldContain", (match: string) => {
  cy.focused().as("startingFocusElt");
  getStdoutElement().should("contain.text", match);
  cy.get("@startingFocusElt").focus();
});

Cypress.Commands.add("pytchStdoutShouldEqual", (match: string) => {
  cy.focused().as("startingFocusElt");
  getStdoutElement().should("have.text", match);
  cy.get("@startingFocusElt").focus();
});

Cypress.Commands.add(
  "pytchCanvasShouldBeSolidColour",
  (expectedColour: ArrayRGBA) => {
    cy.get("#pytch-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (ctx == null) throw new Error("could not get 2d context");
      const pixels = ctx.getImageData(0, 0, stageWidth, stageHeight);
      let allOK = true;
      const nPixels = stageWidth * stageHeight;
      for (let pixelIdx = 0; pixelIdx !== nPixels; ++pixelIdx) {
        const u8Idx = pixelIdx * 4;
        if (
          pixels.data[u8Idx] !== expectedColour[0] ||
          pixels.data[u8Idx + 1] !== expectedColour[1] ||
          pixels.data[u8Idx + 2] !== expectedColour[2] ||
          pixels.data[u8Idx + 3] !== expectedColour[3]
        )
          allOK = false;
      }
      expect(allOK).eq(true);
    });
  }
);

Cypress.Commands.add("pytchShouldHaveBuiltWithoutErrors", () => {
  cy.get(".InfoPanel .nav-link")
    .contains("Errors")
    .should("not.have.class", "active")
    .click();

  cy.get(".ErrorReportAlert").should("not.exist");
});

const shouldBeShowingErrorPane = () => {
  cy.get(".InfoPanel .nav-link")
    .contains("Errors")
    .should("have.class", "active");
};

Cypress.Commands.add("pytchShouldShowErrorContext", (match: ContentMatch) => {
  shouldBeShowingErrorPane();
  cy.get(".error-pane-intro").contains(match);
});

const assertionArgsForErrorKind = (kind: PytchErrorKind): [string, string] => {
  const internalErrorMarkerText = "Unfortunately there is no more information";
  switch (kind) {
    case "user-space":
      return ["not.contain.text", internalErrorMarkerText];
    case "internal":
      return ["contain.text", internalErrorMarkerText];
    default:
      throw Error("unknown error kind");
  }
};

Cypress.Commands.add(
  "pytchShouldShowErrorCard",
  (match: ContentMatch, kind: PytchErrorKind) => {
    shouldBeShowingErrorPane();
    cy.get(".ErrorReportAlert")
      .contains(match)
      .parentsUntil(".ErrorReportAlert")
      .parent()
      .should(...assertionArgsForErrorKind(kind));
  }
);

Cypress.Commands.add(
  "pytchShouldHaveErrorStackTraceOfLength",
  (nFrames: number) => {
    shouldBeShowingErrorPane();
    cy.get(".stack-trace-frame-summary").should("have.length", nFrames);
  }
);

Cypress.Commands.add("pytchGreenFlag", () => {
  cy.get(".GreenFlag").click();
});

Cypress.Commands.add("pytchRedStop", () => {
  cy.get(".RedStop").click();
});

Cypress.Commands.add("pytchChooseDropdownEntry", (entryName: string) => {
  cy.contains("⋮").click();
  cy.get(".dropdown-item").contains(entryName).click();
});

Cypress.Commands.add("pytchSendKeysToProject", (keys: string) => {
  cy.get("#pytch-speech-bubbles").type(keys);
});

Cypress.Commands.add("pytchClickStage", (stageX: number, stageY: number) => {
  cy.get("#pytch-speech-bubbles").then(($e) => {
    const div = $e[0];

    // Translate and scale; also flip y-coord:
    const elementX = ((stageX + stageHalfWidth) / stageWidth) * div.clientWidth;
    const elementY =
      div.clientHeight -
      ((stageY + stageHalfHeight) / stageHeight) * div.clientHeight;

    cy.wrap($e).click(elementX, elementY);
  });
});

Cypress.Commands.add("pytchDragStageDivider", (sizeIncrease: number) => {
  const moveEvent = (x: number, y: number) => ({ clientX: x, clientY: y });
  return cy
    .get(".drag-resizer.vertical")
    .as("resizer")
    .then(($el) => {
      // Get the client coords of the centre of the resizer.
      const rect = $el[0].getBoundingClientRect();
      const sizerX = Math.round(rect.left + 0.5 * rect.width);
      const sizerY = Math.round(rect.top + 0.5 * rect.height);

      // Drag the resizer as per spec, then release mouse-button, then
      // move mouse down by arbitrary amount (150).
      cy.get("@resizer")
        .trigger("movemove", moveEvent(sizerX, sizerY))
        .trigger("mousedown")
        .trigger("mousemove", moveEvent(sizerX + 10, sizerY + sizeIncrease))
        .trigger("mouseup")
        .trigger("mousemove", moveEvent(sizerX + 10, sizerY + 150));
    });
});

Cypress.Commands.add("pytchSendKeysToApp", (keys: string) => {
  cy.focused().type(keys);
});

Cypress.Commands.add("pytchRunThroughButtonTour", () => {
  cy.contains("Click the green flag");
  cy.pytchGreenFlag();
  cy.contains("Click the green flag").should("not.be.visible");
});

Cypress.Commands.add(
  "pytchActivateAssetDropdown",
  (assetName: string, maybeChooseItem = () => {}) => {
    cy.get(".card-header")
      .contains(assetName)
      .parent()
      .within(() => {
        cy.get(".dropdown").click();
        maybeChooseItem();
      });
  }
);

Cypress.Commands.add(
  "pytchClickAssetDropdownItem",
  (assetName: string, itemName: string) => {
    const clickItem = () => cy.contains(itemName).click();
    cy.pytchActivateAssetDropdown(assetName, clickItem);
  }
);

/// <reference types="cypress" />

import { IAceEditor } from "react-ace/lib/types";

context("Build and run projects", () => {
  before(() => {
    cy.pytchExactlyOneProject("Test project");
  });

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
    const lineIndents = lines.map((line) => initialSpaces.exec(line)[0].length);
    const minIndent = Math.min(...lineIndents);
    const strippedLines = lines.map((line) => line.substring(minIndent));
    return strippedLines.join("\n") + "\n";
  };

  // Pick out the editor interface stored by the app.
  const aceEditorFromWindow = (window: any): IAceEditor =>
    (window as any).PYTCH_CYPRESS_ACE_CONTROLLER;

  const setCodeWithDeIndent = (indentedCodeText: string) => {
    const codeText = deIndent(indentedCodeText);
    cy.window().then((window) => {
      const aceEditor = aceEditorFromWindow(window);
      aceEditor.setValue(codeText);
      aceEditor.clearSelection();
      aceEditor.gotoLine(0, 0, true);
    });
  };

  const buildCode = (rawCodeText: string) => {
    setCodeWithDeIndent(rawCodeText);
    cy.get("button").contains("BUILD").click();
  };

  const stdoutShouldContain = (fragment: string) => {
    cy.get(".nav-item").contains("Output").click();
    cy.get(".SkulptStdout").then(($p) => {
      expect($p[0].innerText).to.contain(fragment);
    });
  };

  it("can print hello world", () => {
    buildCode(`
      import pytch
      print("Hello world")
    `);
    stdoutShouldContain("Hello world\n");
  });
});

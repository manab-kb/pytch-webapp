/// <reference types="cypress" />

context("Management of project list", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.contains("My projects").click();
    cy.location("pathname").should("include", "projects");
  });

  const createProject = (name: string, invocation: "button" | "enter") => {
    cy.contains("Create a new project").click();
    cy.get("input[type=text]").type(name);
    if (invocation === "button") {
      cy.get("button").contains("Create project").click();
    } else {
      cy.get("input[type=text]").type("{enter}");
    }
    cy.contains("Project created").should("not.be.visible");
    cy.contains("MyStuff").click();
    cy.contains("My projects");
    cy.contains(name);
  };

  const openProject = (name: string) => {
    cy.contains("My projects");
    cy.contains(name).click();
    cy.get("button").contains("Save");
    cy.get(".ReadOnlyOverlay").should("not.be.visible");
  };

  const projectNames = () =>
    cy
      .get(".project-name")
      .then(($spans) => $spans.toArray().map((span) => span.innerText));

  it("can create a project", () => {
    createProject("Bananas", "button");
    projectNames().should("deep.equal", ["Test seed project", "Bananas"]);
  });

  it("can create multiple projects", () => {
    createProject("Bananas", "button");
    createProject("Space Invaders", "enter");
    projectNames().should("deep.equal", [
      "Test seed project",
      "Bananas",
      "Space Invaders",
    ]);
  });

  it("can save and re-open projects", () => {
    createProject("Pac-Person", "button");
    openProject("Pac-Person");
    cy.get("#pytch-ace-editor").type("# HELLO PAC-PERSON{enter}");
    cy.get("button").contains("Save").click();
    cy.get("button").contains("MyStuff").click();
    openProject("Pac-Person");
    cy.pytchCodeTextShouldContain("HELLO PAC-PERSON");

    cy.get("button").contains("MyStuff").click();
    openProject("Test seed");
    cy.get("#pytch-ace-editor").type("# HELLO SEED PROJECT{enter}");
    cy.get("button").contains("Save").click();
    cy.get("button").contains("MyStuff").click();

    openProject("Pac-Person");
    cy.pytchCodeTextShouldContain("HELLO PAC-PERSON");

    cy.get("button").contains("MyStuff").click();
    openProject("Test seed");
    cy.pytchCodeTextShouldContain("HELLO SEED PROJECT");
  });

  it("handles open of non-existent project", () => {
    cy.window().then((window) => {
      const badId = (window as any).PYTCH_CYPRESS.nonExistentProjectId;
      cy.visit(`http://localhost:3000/ide/${badId}`);
      cy.contains("Sorry, there was a problem");
      cy.contains("Return to").click();
      cy.contains("My projects");
      cy.contains("Test seed");
    });
  });

  const launchDeletion = (projectName: string) => {
    cy.get(".project-name")
      .contains(projectName)
      .parent()
      .parent()
      .within(() => {
        cy.get(".dropdown").click();
        cy.contains("DELETE").click();
      });
  };

  it("can delete a project", () => {
    createProject("Apples", "enter");
    createProject("Bananas", "button");
    projectNames().should("deep.equal", [
      "Test seed project",
      "Apples",
      "Bananas",
    ]);
    launchDeletion("Apples");
    cy.contains("Are you sure");
    cy.get("button").contains("DELETE").click();
    projectNames().should("deep.equal", ["Test seed project", "Bananas"]);
  });

  [
    {
      label: "escape key",
      invoke: () => cy.contains("Are you sure").type("{esc}"),
    },
    {
      label: "cancel button",
      invoke: () => cy.get("button").contains("Cancel").click(),
    },
  ].forEach((cancelMethod) => {
    it(`can cancel project deletion (via ${cancelMethod.label})`, () => {
      createProject("Apples", "button");
      createProject("Bananas", "enter");

      launchDeletion("Apples");
      cancelMethod.invoke();
      cy.contains("Are you sure").should("not.exist");
      projectNames().should("deep.equal", [
        "Test seed project",
        "Apples",
        "Bananas",
      ]);
    });
  });
});

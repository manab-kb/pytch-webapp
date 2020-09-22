/// <reference types="cypress" />

context("Management of project assets", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.contains("Images and sounds").click();
  });

  const initialAssets = ["red-rectangle-80-60.png", "sine-1kHz-2s.mp3"];

  it("shows project assets", () => {
    cy.pytchShouldShowAssets(initialAssets);
  });

  it("can add image asset", () => {
    cy.contains("Add an image").click();
    cy.contains("Add to project").should("be.disabled");
    cy.get(".form-control-file").attachFile(
      "sample-project-assets/green-circle-64.png"
    );
    cy.contains("Add to project").should("not.be.disabled").click();
    cy.get(".modal-content").should("not.exist");
    cy.pytchShouldShowAssets([...initialAssets, "green-circle-64.png"]);
  });

  const activateAssetDropdown = (
    assetName: string,
    maybeChooseItem = () => {}
  ) => {
    cy.get(".card-header")
      .contains(assetName)
      .parent()
      .within(() => {
        cy.get(".dropdown").click();
        maybeChooseItem();
      });
  };

  const clickAssetDropdownItem = (assetName: string, itemName: string) => {
    activateAssetDropdown(assetName, () => cy.contains(itemName).click());
  };

  const launchDeletion = (assetName: string) => {
    clickAssetDropdownItem(assetName, "DELETE");
  };

  initialAssets.forEach((assetName, assetIndex) => {
    it(`can delete (${assetIndex})th asset`, () => {
      launchDeletion(assetName);
      cy.get("button").contains("DELETE").click();

      const expectedAssets = initialAssets.slice();
      expectedAssets.splice(assetIndex, 1);

      cy.pytchShouldShowAssets(expectedAssets);
    });
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
    it(`can cancel asset deletion (via ${cancelMethod.label})`, () => {
      launchDeletion(initialAssets[0]);
      cancelMethod.invoke();
      cy.pytchShouldShowAssets(initialAssets);
    });
  });

  it("can copy asset name", () => {
    // Actually clicking the Copy name item gives
    // "DOMException: Document is not focused"
    // which seems to be a known problem:
    // https://github.com/cypress-io/cypress/issues/2386
    // Likewise, we can't test the contents of the clipboard,
    // so have to just hope that the actual copying worked.
    //
    activateAssetDropdown("rectangle");
    cy.contains("Copy name");
  });

  it("can rename assets", () => {
    clickAssetDropdownItem("rectangle", "Rename");
    cy.get("input[type=text]").clear().type("vermillion-rectangle.png");
    cy.get("button").contains("Rename").click();

    clickAssetDropdownItem("sine-1kHz", "Rename");
    cy.get("input[type=text]").clear().type("beep.mp3{enter}");

    cy.pytchShouldShowAssets(["vermillion-rectangle.png", "beep.mp3"]);
  });
});
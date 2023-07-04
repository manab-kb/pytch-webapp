/// <reference types="cypress" />
import txt from "../../src/assets/globaldata-pytch.json";

describe("Cypress Testing Pipeline", () => {

  for (var i = 1; i <= 26827; i++) {

    var code = txt[i]["code"];
    var category = txt[i]["category"];
    var errors = txt[i]["errormsg-PytchVM"];

    if (category !== "") {

      if (errors === "CORRECT: No errors were found") {

        it("Navigates to tutorial", () => {
          cy.visit("http://localhost:3000/tutorials/");

          cy.contains(category);
          cy.contains("Learn how to make this project").click();
        });

        // TO-DO: filter code before being typed as auto formatting is turned on (remove all escape sequences)
        it("Inserts code into code editor", () => {
          cy.get("#pytch-ace-editor").type(code);
        });

        it("Saves current program status", () => {
          cy.get("button").contains("Save").click();
        });

        it("Clicks green flag and runs program", () => {
          cy.get(".GreenFlag").click();
        });

        switch (category) {
          case "Hello world!":
            it("HELLO WORLD TESTING: clicking on image", () => {
                cy.get("img").contains("Snake.png").click().contains("Hello there!");
            })
            break;

          case "Shoot the fruit":
            // TO-DO: determine if the fruit displayed is an orange or an apple without raising errors
            it("SHOOT THE FRUIT TESTING: clicking on apples and oranges", () => {
                cy.get("img").contains("apple.png").click().contains("score").should("have.value", "1");
                cy.get("img").contains("orange.png").click().contains("score").should("have.value", "2");
            })
            break;

          case "Chase game":
            it("CHASE GAME TESTING:", () => {
            })
            break;

          case "Catch the apple!":
            it("CATCH THE APPLE TESTING:", () => {
            })
            break;

          case "Blue Invaders":
            it("BLUE INVADERS TESTING:", () => {
            })
            break;

          case "Multiple choice quiz":
            it("MULTIPLE CHOICE QUIZ TESTING:", () => {
            })
            break;

          case "Splat the moles":
            it("SPLAT THE MOLES TESTING:", () => {
            })
            break;

          case "Trimon":
            it("TRIMON TESTING:", () => {
            })
            break;

          case "Q*bert: Recreate the cube-hopping action":
            it("QBERT TESTING:", () => {
            })
            break;

          case "Bunner — a Frogger-like game":
            it("BUNNER TESTING:", () => {
            })
            break;

          case "Boing — a Pong-like game":
            it("BOING TESTING:", () => {
            })
            break;

          case "A vending machine for tickets":
            it("VENDING MACHINE TESTING:", () => {
            })
            break;

          default:
            break;
        }

        // TO-DO: create downloadable text file to return errors if any or a status depicting that the code is functional
      }
    }
  }
});

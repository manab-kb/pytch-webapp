/// <reference types="cypress" />
import txt from "../../src/assets/globaldata-pytch.json";

describe("Cypress Testing Pipeline", () => {

  for (var i = 1; i <= 26827; i++) {

    var code = txt[i]["code"];
    var category = txt[i]["category"];

    if (category !== "") {

      it("Navigates to tutorial", () => {
        cy.visit("http://localhost:3000/tutorials/");

        cy.contains(category);
        cy.contains("Learn how to make this project").click();
      });

      it("Inserts code into code editor", () => {
        cy.get("#pytch-ace-editor").type(code);
      });

      it("Saves current program status", () => {
        cy.get("button").contains("Save").click();
      })

      it("Clicks green flag and runs program", () => {
        cy.get(".GreenFlag").click();
      })

      // TO-DO: Define what keys to press and actions to perform based on the program category
      switch(category) {
        case 1:
            break;
        
        case 2:
            break;
        
        case 3:
            break;
        
        case 4:
            break;
        
        case 5:
            break;
        
        case 6:
            break;
        
        case 7:
            break;
        
        case 8:
            break;
        
        case 9:
            break;
        
        case 10:
            break;
        
        case 11:
            break;
        
        case 12:
            break;
        
        default:
            break;
        
      }
    
    // TO-DO: create downloadable text file to return errors if any or a status depicting that the code is functional
    }

  }
});

/// <reference types="cypress" />

context("Runtime errors", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("reports error if render fails", () => {
    // This is mildly fiddly to arrange.  We want an error to be
    // raised when accessing information needed during render, but
    // only after the green flag has been clicked.
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]
        give_error = False

        @property
        def _x(self):
          if self.give_error:
            raise RuntimeError("oh no")
          else:
            return 0

        @_x.setter
        def _x(self, x):
          pass

        @pytch.when_green_flag_clicked
        def cause_trouble(self):
          self.give_error = True
      `);

    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.pytchShouldShowErrorCard("oh no");
  });

  it("reports error if event handler fails", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = [("rect", "red-rectangle-80-60.png", 0, 0)]

        @pytch.when_green_flag_clicked
        def cause_trouble(self):
          self.no_such_method()
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.pytchShouldShowErrorContext("has stopped");
    cy.pytchShouldShowErrorCard(/no attribute.*no_such_method/);
  });

  it("reports error with deeper stack trace", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = []

        @pytch.when_green_flag_clicked
        def cause_trouble(self):
          self.cause_more_trouble()

        def cause_more_trouble(self):
          self.cause_lots_more_trouble()

        def cause_lots_more_trouble(self):
          self.actually_cause_trouble()

        def actually_cause_trouble(self):
          print(1 / 0)
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.pytchShouldShowErrorContext("has stopped");
    cy.pytchShouldShowErrorCard("division or modulo by zero");
    cy.pytchShouldHaveErrorStackTraceOfLength(4);
  });

  it("reports multiple simultaneous errors", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = []
        @pytch.when_green_flag_clicked
        def banana_trouble(self):
          self.no_such_method()

      class Cherry(pytch.Sprite):
        Costumes = []
        @pytch.when_green_flag_clicked
        def cherry_trouble(self):
          print(1 / 0)
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.pytchShouldShowErrorContext("has stopped");
    cy.get(".ErrorReportAlert").should("have.length", 2);
    cy.pytchShouldShowErrorCard(
      /Banana.*banana_trouble.*green-flag.*AttributeError.*no_such_method/
    );
    cy.pytchShouldShowErrorCard(
      /Cherry.*cherry_trouble.*green-flag.*ZeroDivisionError/
    );
  });
});

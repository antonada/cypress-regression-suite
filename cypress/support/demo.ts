import './e2e';

// Demo recordings only: hold the final screen of each test long enough to see it
afterEach(() => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1500, { log: false });
});

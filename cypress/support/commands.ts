const SESSION_KEY = 'orderly.session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Shorthand for cy.get('[data-cy="..."]') */
      getByCy(name: string): Chainable<JQuery<HTMLElement>>;
      /** Signs in through the API and caches the session across specs */
      login(): Chainable<void>;
      /** Puts the demo data back to its seeded state */
      resetData(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getByCy', (name: string) => cy.get(`[data-cy="${name}"]`));

Cypress.Commands.add('login', () => {
  cy.session(
    'admin',
    () => {
      cy.fixture('user').then(({ email, password }) => {
        cy.request('POST', '/api/login', { email, password }).then(({ body }) => {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(body));
        });
      });
    },
    {
      cacheAcrossSpecs: true,
      // The server forgets tokens on logout or restart, so check the cached one still works
      validate() {
        const token = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? '{}').token;
        cy.request({ url: '/api/notifications', headers: { Authorization: `Bearer ${token}` } });
      },
    },
  );
});

Cypress.Commands.add('resetData', () => {
  cy.request('POST', '/api/test/reset');
});

export {};

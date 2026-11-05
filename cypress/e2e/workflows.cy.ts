// These run against the real API with no stubs, so they catch problems in the whole stack.
describe('Order workflows', { tags: ['@smoke', '@e2e'] }, () => {
  beforeEach(() => {
    cy.resetData();
  });

  it('signs in through the form and lands on the orders list', () => {
    cy.visit('/orders');
    cy.location('pathname').should('eq', '/login');

    cy.fixture('user').then((user) => {
      cy.get('#email').type(user.email);
      cy.get('#password').type(user.password, { log: false });
      cy.contains('button', 'Sign in').click();

      cy.location('pathname').should('eq', '/orders');
      cy.getByCy('current-user').should('have.text', user.name);
    });
    cy.getByCy('order-row').should('have.length', 10);
    cy.getByCy('orders-summary').should('have.text', 'Showing 1 to 10 of 45 orders');
  });

  it('shows an error for a wrong password', () => {
    cy.visit('/login');
    cy.get('#email').type('admin@orderly.test');
    cy.get('#password').type('wrong-password');
    cy.contains('button', 'Sign in').click();

    cy.getByCy('login-error').should('have.text', 'Invalid email or password.');
    cy.location('pathname').should('eq', '/login');
  });

  it('filters paid orders, opens one and marks it as shipped', () => {
    cy.login();
    cy.visit('/orders');

    cy.getByCy('status-filter').select('Paid');
    cy.location('search').should('eq', '?status=paid');
    cy.getByCy('order-row').should('have.length', 10);
    cy.getByCy('status-badge').each(($badge) => expect($badge.text()).to.eq('Paid'));

    cy.contains('[data-cy="order-link"]', 'ORD-1041').click();
    cy.getByCy('order-title').should('have.text', 'ORD-1041');
    cy.getByCy('status-select').select('Shipped');
    cy.getByCy('save-status').click();

    cy.getByCy('toast').should('have.text', 'ORD-1041 marked as Shipped');
    cy.reload();
    cy.getByCy('status-badge').should('have.text', 'Shipped');
  });

  it('creates an order that shows up at the top of the list', () => {
    cy.intercept('POST', '/api/orders').as('createOrder');
    cy.login();
    cy.visit('/orders/new');

    cy.getByCy('input-customerName').type('Jordan Ellis');
    cy.getByCy('input-email').type('jordan.ellis@example.com');
    cy.getByCy('input-itemName').type('Monitor arm');
    cy.getByCy('input-quantity').clear();
    cy.getByCy('input-quantity').type('2');
    cy.getByCy('input-unitPrice').type('89.50');
    cy.getByCy('submit-order').click();

    cy.wait('@createOrder').its('response.statusCode').should('eq', 201);
    cy.location('pathname').should('eq', '/orders/ORD-1046');
    cy.getByCy('toast').should('have.text', 'Order ORD-1046 created');
    cy.getByCy('order-total').should('have.text', '$179.00');
    cy.getByCy('status-badge').should('have.text', 'Pending');

    cy.contains('a', 'Back to orders').click();
    cy.getByCy('order-row').first().should('contain', 'ORD-1046').and('contain', 'Jordan Ellis');
  });

  it('finds orders by customer name', () => {
    cy.login();
    cy.visit('/orders');

    cy.getByCy('search').type('maya');

    cy.location('search').should('eq', '?q=maya');
    cy.getByCy('order-customer')
      .should('have.length', 3)
      .each(($cell) => {
        expect($cell.text()).to.eq('Maya Patel');
      });
  });

  it('signing out ends the session', () => {
    // Signs in through the form on purpose: the cached cy.login() token must stay valid for other specs
    cy.visit('/login');
    cy.fixture('user').then((user) => {
      cy.get('#email').type(user.email);
      cy.get('#password').type(user.password, { log: false });
    });
    cy.contains('button', 'Sign in').click();
    cy.getByCy('order-row').should('have.length', 10);

    cy.getByCy('logout').click();
    cy.location('pathname').should('eq', '/login');

    cy.visit('/orders/ORD-1001');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('eq', `?returnTo=${encodeURIComponent('/orders/ORD-1001')}`);
  });
});

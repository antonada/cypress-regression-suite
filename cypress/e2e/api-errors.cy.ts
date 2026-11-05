const ORDERS = { method: 'GET', pathname: '/api/orders' };

describe('API errors', { tags: ['@regression', '@api-errors'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  context('orders list', () => {
    it('shows an error on 500 and loads the list after "Try again"', () => {
      // times: 1 fails only the first request, the retry goes to the real API.
      // The spy is registered last so it runs first and sees both requests.
      cy.intercept({ ...ORDERS, times: 1 }, { statusCode: 500, body: { error: 'Internal Server Error' } });
      cy.intercept(ORDERS).as('orders');
      cy.visit('/orders');

      cy.getByCy('orders-error').within(() => {
        cy.contains('h2', "Couldn't load orders");
        cy.contains('Something went wrong on our side.');
        cy.contains('button', 'Try again').click();
      });

      cy.getByCy('orders-error').should('not.exist');
      cy.getByCy('order-row').should('have.length', 10);
      cy.get('@orders.all').should('have.length', 2);
    });

    it('explains planned maintenance on 503', () => {
      cy.intercept(ORDERS, { statusCode: 503, body: {} });
      cy.visit('/orders');

      cy.getByCy('orders-error').should('contain', 'Orderly is down for maintenance.');
    });

    it('explains a dropped connection', () => {
      cy.intercept(ORDERS, { forceNetworkError: true });
      cy.visit('/orders');

      cy.getByCy('orders-error').should('contain', "We can't reach the server.");
    });

    it('asks the user to slow down on 429', () => {
      cy.intercept(ORDERS, { statusCode: 429, body: { error: 'Too Many Requests' } });
      cy.visit('/orders');

      cy.getByCy('orders-error').should('contain', 'Too many requests.');
    });

    it('does not crash on a response that is not JSON', () => {
      cy.intercept(ORDERS, {
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        body: '<html>Bad gateway</html>',
      });
      cy.visit('/orders');

      cy.getByCy('orders-error').should('contain', "The server sent a response we couldn't read.");
    });

    it('keeps working when only the notifications API fails', () => {
      cy.intercept('GET', '/api/notifications', { statusCode: 500, body: {} }).as('notifications');
      cy.visit('/orders');
      cy.wait('@notifications');

      cy.getByCy('order-row').should('have.length', 10);
      cy.getByCy('notifications-button').click();
      cy.getByCy('notifications-error').should('be.visible');
    });
  });

  context('session', () => {
    it('sends the user to sign in on 401 and brings them back afterwards', () => {
      cy.intercept({ ...ORDERS, times: 1 }, { statusCode: 401, body: { error: 'Session expired' } });
      cy.visit('/orders?status=paid&page=2');

      cy.location('pathname').should('eq', '/login');
      cy.getByCy('session-expired').should('have.text', 'Your session has expired. Please sign in again.');

      cy.fixture('user').then((user) => {
        cy.get('#email').type(user.email);
        cy.get('#password').type(user.password, { log: false });
      });
      cy.contains('button', 'Sign in').click();

      cy.location('pathname').should('eq', '/orders');
      cy.location('search').should('eq', '?status=paid&page=2');
      cy.getByCy('status-filter').should('have.value', 'paid');
    });
  });

  context('order details', () => {
    it('shows "not found" for an order that does not exist', () => {
      // No stub here: the real API answers 404 for unknown ids
      cy.visit('/orders/ORD-9999');

      cy.getByCy('order-not-found').should('contain', 'Order not found').and('contain', 'ORD-9999');
    });

    it('shows a no-access message on 403', () => {
      cy.intercept('GET', '/api/orders/ORD-1042', { statusCode: 403, body: { error: 'Forbidden' } });
      cy.visit('/orders/ORD-1042');

      cy.getByCy('order-forbidden').should('contain', "You don't have access to this order");
      cy.getByCy('status-select').should('not.exist');
    });

    it('can retry after a server error', () => {
      // Newer intercepts win, so the one-off failure goes last and the fixture takes over afterwards
      cy.intercept('GET', '/api/orders/ORD-1042', { fixture: 'orders/ORD-1042.json' }).as('order');
      cy.intercept({ method: 'GET', pathname: '/api/orders/ORD-1042', times: 1 }, { statusCode: 500, body: {} });
      cy.visit('/orders/ORD-1042');

      cy.getByCy('order-error').contains('button', 'Try again').click();

      cy.wait('@order');
      cy.getByCy('order-title').should('have.text', 'ORD-1042');
      cy.getByCy('order-item').should('have.length', 2);
    });

    it('keeps the old status and shows a toast when saving fails', () => {
      cy.intercept('GET', '/api/orders/ORD-1042', { fixture: 'orders/ORD-1042.json' });
      cy.intercept('PATCH', '/api/orders/ORD-1042', { statusCode: 500, body: {} }).as('update');
      cy.visit('/orders/ORD-1042');

      cy.getByCy('status-select').select('Shipped');
      cy.getByCy('save-status').click();

      cy.wait('@update').its('request.body').should('deep.equal', { status: 'shipped' });
      cy.getByCy('toast').should('have.text', "Couldn't update the status. Please try again.");
      cy.getByCy('status-select').should('have.value', 'pending');
      cy.getByCy('status-badge').should('have.text', 'Pending');
    });
  });

  context('creating an order', () => {
    function fillValidOrder() {
      cy.getByCy('input-customerName').type('Jordan Ellis');
      cy.getByCy('input-email').type('jordan.ellis@example.com');
      cy.getByCy('input-itemName').type('Monitor arm');
      cy.getByCy('input-unitPrice').type('89.50');
    }

    it('maps 422 validation errors from the server onto the form', () => {
      cy.intercept('POST', '/api/orders', {
        statusCode: 422,
        body: { errors: { email: 'This customer is blocked from ordering' } },
      });
      cy.visit('/orders/new');
      fillValidOrder();
      cy.getByCy('submit-order').click();

      cy.getByCy('error-email').should('have.text', 'This customer is blocked from ordering');
      cy.getByCy('input-email').should('have.attr', 'aria-invalid', 'true').and('be.focused');
      cy.getByCy('form-error').should('have.text', 'Please fix the highlighted fields.');
    });

    it('keeps what the user typed when the server fails', () => {
      cy.intercept('POST', '/api/orders', { statusCode: 500, body: {} });
      cy.visit('/orders/new');
      fillValidOrder();
      cy.getByCy('submit-order').click();

      cy.getByCy('form-error').should('contain', "The order wasn't saved.");
      cy.location('pathname').should('eq', '/orders/new');
      cy.getByCy('input-customerName').should('have.value', 'Jordan Ellis');
      cy.getByCy('input-unitPrice').should('have.value', '89.50');
      cy.getByCy('submit-order').should('be.enabled');
    });
  });
});

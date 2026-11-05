import { buildOrder, buildPage } from '../support/factories';

const ORDERS = { method: 'GET', pathname: '/api/orders' };

describe('Loading states and timing', { tags: '@regression' }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('shows a skeleton while the orders are loading', () => {
    cy.intercept(ORDERS, { delay: 1500, fixture: 'orders/first-page.json' }).as('orders');
    cy.visit('/orders');

    cy.getByCy('orders-skeleton').should('be.visible');
    cy.getByCy('order-row').should('not.exist');

    cy.wait('@orders');
    cy.getByCy('orders-skeleton').should('not.exist');
    cy.getByCy('order-row').should('have.length', 10);
  });

  it('waits for the user to stop typing before searching', () => {
    // A fake clock makes the 400 ms debounce testable without real waiting
    cy.clock();
    cy.intercept(ORDERS).as('orders');
    cy.visit('/orders');
    cy.wait('@orders');

    cy.getByCy('search').type('maya', { delay: 0 });
    cy.tick(399);
    cy.get('@orders.all').should('have.length', 1);

    cy.tick(1);
    cy.wait('@orders').its('request.query.q').should('eq', 'maya');
    cy.get('@orders.all').should('have.length', 2);
  });

  it('ignores a slow response that arrives after a newer one', () => {
    cy.intercept(ORDERS, (req) => {
      if (req.query.status === 'paid') {
        req.reply({ delay: 1500, body: buildPage([buildOrder({ customer: { name: 'Slow Response' } })]) });
      } else if (req.query.status === 'shipped') {
        req.reply(buildPage([buildOrder({ customer: { name: 'Fast Response' } })]));
      } else {
        req.reply(buildPage([buildOrder()]));
      }
    });
    cy.visit('/orders');
    cy.getByCy('order-row').should('have.length', 1);

    cy.getByCy('status-filter').select('Paid');
    cy.getByCy('status-filter').select('Shipped');
    cy.getByCy('order-customer').should('have.text', 'Fast Response');

    // A fixed wait on purpose: the test has to outlast the slow response to prove it gets ignored
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.getByCy('order-customer').should('have.text', 'Fast Response');
  });

  it('disables the status button while saving', () => {
    cy.fixture('orders/ORD-1042.json').then((order) => {
      cy.intercept('GET', '/api/orders/ORD-1042', order);
      cy.intercept('PATCH', '/api/orders/ORD-1042', { delay: 1000, body: { ...order, status: 'paid' } }).as('update');
    });
    cy.visit('/orders/ORD-1042');

    cy.getByCy('status-select').select('Paid');
    cy.getByCy('save-status').click();

    cy.getByCy('save-status').should('be.disabled').and('have.text', 'Saving...');
    cy.wait('@update');
    cy.getByCy('toast').should('have.text', 'ORD-1042 marked as Paid');
    cy.getByCy('save-status').should('have.text', 'Update status');
  });

  it('sends only one request when "Create order" is double-clicked', () => {
    cy.intercept('POST', '/api/orders', { statusCode: 201, delay: 600, body: buildOrder() }).as('create');
    cy.intercept('GET', '/api/orders/ORD-2001', buildOrder());
    cy.visit('/orders/new');

    cy.getByCy('input-customerName').type('Jordan Ellis');
    cy.getByCy('input-email').type('jordan.ellis@example.com');
    cy.getByCy('input-itemName').type('Monitor arm');
    cy.getByCy('input-unitPrice').type('89.50');
    cy.getByCy('submit-order').dblclick();

    cy.getByCy('toast').should('have.text', 'Order ORD-2001 created');
    cy.get('@create.all').should('have.length', 1);
  });
});

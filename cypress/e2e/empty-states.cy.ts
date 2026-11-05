import { buildOrder, buildPage, emptyPage } from '../support/factories';

const ORDERS = { method: 'GET', pathname: '/api/orders' };

describe('Empty states', { tags: '@regression' }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('shows a first-run message when there are no orders at all', () => {
    cy.intercept(ORDERS, emptyPage()).as('orders');
    cy.visit('/orders');
    cy.wait('@orders');

    cy.getByCy('orders-empty').within(() => {
      cy.contains('h2', 'No orders yet');
      cy.contains('a', 'Create the first order').should('have.attr', 'href', '/orders/new');
    });
    cy.getByCy('orders-table').should('not.exist');
    cy.getByCy('next-page').should('not.exist');
  });

  it('offers to clear filters when a search finds nothing', () => {
    cy.intercept(ORDERS, (req) => {
      // Only searches come back empty, the unfiltered list still has data
      req.reply(req.query.q ? emptyPage() : buildPage([buildOrder()]));
    }).as('orders');

    cy.visit('/orders?q=nobody');
    cy.wait('@orders').its('request.query.q').should('eq', 'nobody');
    cy.getByCy('orders-no-results').should('contain', 'No orders match your filters');

    cy.contains('button', 'Clear filters').click();

    cy.wait('@orders').its('request.query').should('not.have.property', 'q');
    cy.location('search').should('eq', '');
    cy.getByCy('search').should('have.value', '');
    cy.getByCy('order-row').should('have.length', 1);
  });

  it('shows the no-results state for a status nobody has', () => {
    cy.intercept(ORDERS, (req) => {
      req.reply(req.query.status === 'cancelled' ? emptyPage() : buildPage([buildOrder()]));
    }).as('orders');
    cy.visit('/orders');
    cy.wait('@orders');

    cy.getByCy('status-filter').select('Cancelled');

    cy.wait('@orders').its('request.query.status').should('eq', 'cancelled');
    cy.getByCy('orders-no-results').should('be.visible');
    cy.getByCy('orders-empty').should('not.exist');
  });

  it('tells the user they are all caught up when there are no notifications', () => {
    cy.intercept('GET', '/api/notifications', { items: [] }).as('notifications');
    cy.visit('/orders');
    cy.wait('@notifications');

    cy.getByCy('notifications-count').should('not.exist');
    cy.getByCy('notifications-button').click();
    cy.getByCy('notifications-empty').should('have.text', "You're all caught up.");
  });

  it('handles an order that has no line items', () => {
    cy.intercept('GET', '/api/orders/ORD-2001', buildOrder({ items: [], total: 0 }));
    cy.visit('/orders/ORD-2001');

    cy.getByCy('order-items-empty').should('have.text', 'This order has no items.');
    cy.getByCy('order-total').should('have.text', '$0.00');
  });

  it('falls back to placeholders when the API leaves fields out', () => {
    const incomplete = { id: 'ORD-2002', status: 'paid' as const };
    cy.intercept(ORDERS, buildPage([incomplete]));
    cy.visit('/orders');

    cy.getByCy('order-row').within(() => {
      cy.getByCy('order-customer').should('have.text', 'Unknown customer');
      cy.getByCy('order-date').should('have.text', 'Unknown date');
      cy.getByCy('order-total').should('have.text', 'N/A');
    });
    // Missing data should never leak into the UI as raw JavaScript values
    cy.getByCy('orders-table').should('not.contain', 'undefined').and('not.contain', 'NaN');
  });
});

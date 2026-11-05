import { paginate, type Order } from '../support/factories';

const ORDERS = { method: 'GET', pathname: '/api/orders' };

// The list is served from a 45-order fixture, so paging and formatting checks don't depend on the database
describe('Orders list', { tags: '@regression' }, () => {
  beforeEach(() => {
    cy.login();
    cy.fixture<Order[]>('orders/all-orders.json').then((all) => {
      cy.intercept(ORDERS, (req) => req.reply(paginate(all, req.query))).as('orders');
    });
  });

  it('shows the first page of orders with formatted values', () => {
    cy.visit('/orders');

    cy.getByCy('order-row').should('have.length', 10);
    cy.getByCy('order-row')
      .first()
      .within(() => {
        cy.getByCy('order-link').should('have.text', 'ORD-1045').and('have.attr', 'href', '/orders/ORD-1045');
        cy.getByCy('order-customer').should('have.text', 'Ethan Walsh');
        cy.getByCy('order-date').should('have.text', 'Oct 31, 2026');
        cy.getByCy('status-badge').should('have.text', 'Shipped');
        cy.getByCy('order-total').should('have.text', '$267.00');
      });
    cy.getByCy('orders-summary').should('have.text', 'Showing 1 to 10 of 45 orders');
    cy.getByCy('page-indicator').should('have.text', 'Page 1 of 5');
    cy.getByCy('prev-page').should('be.disabled');
  });

  it('moves to the next page', () => {
    cy.visit('/orders');
    cy.wait('@orders');

    cy.getByCy('next-page').click();

    cy.wait('@orders').its('request.query.page').should('eq', '2');
    cy.location('search').should('eq', '?page=2');
    cy.getByCy('orders-summary').should('have.text', 'Showing 11 to 20 of 45 orders');
    cy.getByCy('prev-page').should('be.enabled');
  });

  it('shows the last, partial page correctly', () => {
    cy.visit('/orders?page=5');

    cy.getByCy('order-row').should('have.length', 5);
    cy.getByCy('order-link').last().should('have.text', 'ORD-1001');
    cy.getByCy('orders-summary').should('have.text', 'Showing 41 to 45 of 45 orders');
    cy.getByCy('next-page').should('be.disabled');
  });

  it('sends the sort order to the API and goes back to page 1', () => {
    cy.visit('/orders?page=3');
    cy.wait('@orders');

    cy.getByCy('sort').select('Total: high to low');

    cy.wait('@orders').its('request.query').should('include', { sort: 'total_desc', page: '1' });
    cy.location('search').should('eq', '?sort=total_desc');
  });

  it('sends the status filter to the API', () => {
    cy.visit('/orders?page=2');
    cy.wait('@orders');

    cy.getByCy('status-filter').select('Pending');

    cy.wait('@orders').its('request.query').should('include', { status: 'pending', page: '1' });
    cy.location('search').should('eq', '?status=pending');
  });

  it('restores filters, sort and page from the URL', () => {
    cy.visit('/orders?status=paid&sort=oldest&page=2');

    cy.wait('@orders')
      .its('request.query')
      .should('include', { status: 'paid', sort: 'oldest', page: '2', pageSize: '10' });
    cy.getByCy('status-filter').should('have.value', 'paid');
    cy.getByCy('sort').should('have.value', 'oldest');
    cy.getByCy('page-indicator').should('have.text', 'Page 2 of 5');
  });

  it('opens an order from the list', () => {
    cy.intercept('GET', '/api/orders/ORD-1042', { fixture: 'orders/ORD-1042.json' });
    cy.visit('/orders');

    cy.contains('[data-cy="order-link"]', 'ORD-1042').click();

    cy.location('pathname').should('eq', '/orders/ORD-1042');
    cy.getByCy('customer-name').should('have.text', 'Noah Fischer');
    cy.getByCy('order-item').should('have.length', 2);
    cy.getByCy('order-total').should('have.text', '$695.00');
  });

  it('shows unread notifications in the header', () => {
    cy.intercept('GET', '/api/notifications', {
      items: [
        { id: 'n-1', text: 'ORD-1041 was paid', createdAt: '2026-10-31T16:40:00.000Z', read: false },
        { id: 'n-2', text: 'ORD-1044 is waiting for payment', createdAt: '2026-10-31T09:15:00.000Z', read: false },
        { id: 'n-3', text: 'Weekly sales report is ready', createdAt: '2026-10-30T08:00:00.000Z', read: true },
      ],
    });
    cy.visit('/orders');

    cy.getByCy('notifications-count').should('have.text', '2');
    cy.getByCy('notifications-button').click();
    cy.getByCy('notification').should('have.length', 3).first().should('contain', 'ORD-1041 was paid');
  });
});

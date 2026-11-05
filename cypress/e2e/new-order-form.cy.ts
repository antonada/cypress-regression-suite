import { buildOrder } from '../support/factories';

type Field = 'customerName' | 'email' | 'itemName' | 'quantity' | 'unitPrice';

const valid: Record<Field, string> = {
  customerName: 'Jordan Ellis',
  email: 'jordan.ellis@example.com',
  itemName: 'Monitor arm',
  quantity: '2',
  unitPrice: '89.50',
};

function fillForm(values: Partial<Record<Field, string>>) {
  for (const [field, value] of Object.entries(values)) {
    cy.getByCy(`input-${field}`).clear();
    if (value) cy.getByCy(`input-${field}`).type(value);
  }
}

const invalidInputs: { field: Field; value: string; message: string }[] = [
  { field: 'customerName', value: 'J', message: 'Enter the full customer name' },
  { field: 'email', value: 'jordan@', message: 'Enter a valid email address' },
  { field: 'email', value: 'jordan.example.com', message: 'Enter a valid email address' },
  { field: 'quantity', value: '0', message: 'Quantity must be a whole number from 1 to 99' },
  { field: 'quantity', value: '2.5', message: 'Quantity must be a whole number from 1 to 99' },
  { field: 'quantity', value: '100', message: 'Quantity must be a whole number from 1 to 99' },
  { field: 'unitPrice', value: 'abc', message: 'Enter a price between 0.01 and 10000' },
  { field: 'unitPrice', value: '0', message: 'Enter a price between 0.01 and 10000' },
  { field: 'unitPrice', value: '10.999', message: 'Enter a price between 0.01 and 10000' },
];

describe('New order form', { tags: '@regression' }, () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('POST', '/api/orders', { statusCode: 201, body: buildOrder() }).as('create');
    cy.visit('/orders/new');
  });

  it('flags every required field and sends nothing', { tags: '@smoke' }, () => {
    cy.getByCy('input-quantity').clear();
    cy.getByCy('submit-order').click();

    cy.getByCy('error-customerName').should('have.text', 'Customer name is required');
    cy.getByCy('error-email').should('have.text', 'Email is required');
    cy.getByCy('error-itemName').should('have.text', 'Item is required');
    cy.getByCy('error-quantity').should('have.text', 'Quantity must be a whole number from 1 to 99');
    cy.getByCy('error-unitPrice').should('have.text', 'Unit price is required');
    cy.getByCy('input-customerName').should('be.focused');
    cy.get('@create.all').should('have.length', 0);
  });

  invalidInputs.forEach(({ field, value, message }) => {
    it(`rejects ${field} "${value}"`, () => {
      fillForm({ ...valid, [field]: value });
      cy.getByCy('submit-order').click();

      cy.getByCy(`error-${field}`).should('have.text', message);
      cy.get('[aria-invalid="true"]').should('have.length', 1);
      cy.get('@create.all').should('have.length', 0);
    });
  });

  it('clears an error as soon as the value is fixed', () => {
    fillForm({ ...valid, email: 'jordan@' });
    cy.getByCy('submit-order').click();
    cy.getByCy('error-email').should('not.be.empty');

    cy.getByCy('input-email').type('example.com');

    cy.getByCy('error-email').should('be.empty');
    cy.getByCy('input-email').should('not.have.attr', 'aria-invalid');
  });

  it('sends the right payload and opens the new order', () => {
    cy.intercept('GET', '/api/orders/ORD-2001', buildOrder());
    fillForm(valid);
    cy.getByCy('submit-order').click();

    cy.wait('@create')
      .its('request.body')
      .should('deep.equal', { ...valid, quantity: 2 });
    cy.location('pathname').should('eq', '/orders/ORD-2001');
    cy.getByCy('toast').should('have.text', 'Order ORD-2001 created');
  });
});

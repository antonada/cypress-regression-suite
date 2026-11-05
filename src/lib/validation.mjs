// Used by both the React app and the Express server, so the rules only live in one place.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PRICE_RE = /^\d+(\.\d{1,2})?$/;

export const STATUSES = ['pending', 'paid', 'shipped', 'cancelled'];

export function validateNewOrder(input = {}) {
  const errors = {};
  const customerName = String(input.customerName ?? '').trim();
  const email = String(input.email ?? '').trim();
  const itemName = String(input.itemName ?? '').trim();
  const quantity = Number(input.quantity);
  const unitPrice = String(input.unitPrice ?? '').trim();

  if (!customerName) errors.customerName = 'Customer name is required';
  else if (customerName.length < 2) errors.customerName = 'Enter the full customer name';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';

  if (!itemName) errors.itemName = 'Item is required';

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    errors.quantity = 'Quantity must be a whole number from 1 to 99';
  }

  if (!unitPrice) errors.unitPrice = 'Unit price is required';
  else if (!PRICE_RE.test(unitPrice) || Number(unitPrice) <= 0 || Number(unitPrice) > 10000) {
    errors.unitPrice = 'Enter a price between 0.01 and 10000';
  }

  return errors;
}

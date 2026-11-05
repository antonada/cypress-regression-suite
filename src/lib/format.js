const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// Dates are shown in UTC so the app looks the same on every machine and in CI
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

export function formatMoney(cents) {
  return typeof cents === 'number' ? money.format(cents / 100) : 'N/A';
}

export function formatDate(iso) {
  const parsed = iso ? new Date(iso) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? date.format(parsed) : 'Unknown date';
}

export const STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

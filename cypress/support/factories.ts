export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export type Order = {
  id: string;
  customer?: { name?: string; email?: string };
  items?: { name: string; quantity: number; unitPrice: number }[];
  total?: number;
  status?: OrderStatus;
  createdAt?: string;
};

export type OrdersPage = {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
};

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ORD-2001',
    customer: { name: 'Test Customer', email: 'test.customer@example.com' },
    items: [{ name: 'Laptop stand', quantity: 1, unitPrice: 3900 }],
    total: 3900,
    status: 'pending',
    createdAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

export function buildPage(items: Order[], overrides: Partial<OrdersPage> = {}): OrdersPage {
  return { items, total: items.length, page: 1, pageSize: 10, ...overrides };
}

export const emptyPage = (): OrdersPage => buildPage([]);

/** Mimics the real API's paging, so stubbed tests can click through pages of fixture data. */
export function paginate(all: Order[], query: Record<string, unknown>): OrdersPage {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 10);
  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    total: all.length,
    page,
    pageSize,
  };
}

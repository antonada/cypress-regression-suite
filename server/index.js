const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { seedOrders, seedNotifications } = require('./seed');
const { validateNewOrder, STATUSES } = require('../src/lib/validation.mjs');

const DEMO_USER = { name: 'Alex Morgan', email: 'admin@orderly.test', password: 'demo1234' };
const MAX_PAGE_SIZE = 50;

let orders = seedOrders();
let notifications = seedNotifications();
const sessions = new Set();

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Lets the end-to-end tests start every spec from the same data
app.post('/api/test/reset', (req, res) => {
  orders = seedOrders();
  notifications = seedNotifications();
  res.status(204).end();
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = crypto.randomUUID();
  sessions.add(token);
  res.json({ token, user: { name: DEMO_USER.name, email: DEMO_USER.email } });
});

app.use('/api', (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer /, '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Session expired' });
  next();
});

app.post('/api/logout', (req, res) => {
  sessions.delete(req.get('authorization').replace(/^Bearer /, ''));
  res.status(204).end();
});

const SORTERS = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  total_desc: (a, b) => b.total - a.total,
  total_asc: (a, b) => a.total - b.total,
};

app.get('/api/orders', (req, res) => {
  const q = String(req.query.q ?? '')
    .trim()
    .toLowerCase();
  const status = String(req.query.status ?? '');
  const sorter = SORTERS[req.query.sort] ?? SORTERS.newest;
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const matching = orders
    .filter((o) => !status || o.status === status)
    .filter(
      (o) =>
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q),
    )
    .sort(sorter);

  res.json({
    items: matching.slice((page - 1) * pageSize, page * pageSize),
    total: matching.length,
    page,
    pageSize,
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!STATUSES.includes(req.body?.status)) {
    return res.status(422).json({ errors: { status: 'Unknown status' } });
  }
  order.status = req.body.status;
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const errors = validateNewOrder(req.body);
  if (Object.keys(errors).length > 0) return res.status(422).json({ errors });

  const { customerName, email, itemName, quantity, unitPrice } = req.body;
  const priceInCents = Math.round(Number(unitPrice) * 100);
  const lastNumber = Math.max(...orders.map((o) => Number(o.id.slice(4))), 1000);
  const order = {
    id: `ORD-${lastNumber + 1}`,
    customer: { name: customerName.trim(), email: email.trim() },
    items: [{ name: itemName.trim(), quantity: Number(quantity), unitPrice: priceInCents }],
    total: Number(quantity) * priceInCents,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  res.status(201).json(order);
});

app.get('/api/notifications', (req, res) => {
  res.json({ items: notifications });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
// Client-side routes like /orders/ORD-1001 all load the same page
app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = Number(process.env.PORT ?? 4173);
app.listen(port, () => console.log(`Orderly API and app on http://localhost:${port}`));

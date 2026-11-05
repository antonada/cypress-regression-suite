const CUSTOMERS = [
  ['Maya Patel', 'maya.patel@example.com'],
  ['Lucas Moreau', 'lucas.moreau@example.com'],
  ['Hannah Kim', 'hannah.kim@example.com'],
  ['Diego Alvarez', 'diego.alvarez@example.com'],
  ['Olivia Brooks', 'olivia.brooks@example.com'],
  ['Noah Fischer', 'noah.fischer@example.com'],
  ['Amara Okafor', 'amara.okafor@example.com'],
  ['Ethan Walsh', 'ethan.walsh@example.com'],
  ['Sofia Rossi', 'sofia.rossi@example.com'],
  ['Kenji Tanaka', 'kenji.tanaka@example.com'],
  ['Grace Lindqvist', 'grace.lindqvist@example.com'],
  ['Omar Haddad', 'omar.haddad@example.com'],
];

const PRODUCTS = [
  ['Standing desk mat', 4900],
  ['Laptop stand', 3900],
  ['Mechanical keyboard', 12900],
  ['USB-C hub', 5900],
  ['Desk lamp', 4500],
  ['Noise-cancelling headphones', 19900],
  ['Webcam 1080p', 6900],
  ['Cable organizer kit', 1900],
];

const STATUSES = ['pending', 'paid', 'paid', 'shipped', 'shipped', 'cancelled'];

// Small deterministic generator so every reset produces exactly the same data
function random(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function seedOrders(count = 45) {
  const next = random(42);
  const pick = (list) => list[Math.floor(next() * list.length)];
  const start = Date.UTC(2026, 9, 31, 17, 0);
  const orders = [];

  for (let i = 0; i < count; i++) {
    const [name, email] = pick(CUSTOMERS);
    const lineCount = 1 + Math.floor(next() * 3);
    const items = [];
    for (let j = 0; j < lineCount; j++) {
      const [product, price] = pick(PRODUCTS);
      items.push({ name: product, quantity: 1 + Math.floor(next() * 3), unitPrice: price });
    }

    orders.push({
      id: `ORD-${1001 + i}`,
      customer: { name, email },
      items,
      total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      status: pick(STATUSES),
      // Roughly one order every 7 hours, newest last
      createdAt: new Date(start - (count - 1 - i) * 7 * 3600 * 1000).toISOString(),
    });
  }
  return orders;
}

function seedNotifications() {
  return [
    { id: 'n-1', text: 'ORD-1041 was paid', createdAt: '2026-10-31T16:40:00.000Z', read: false },
    { id: 'n-2', text: 'ORD-1044 is waiting for payment', createdAt: '2026-10-31T09:15:00.000Z', read: false },
    { id: 'n-3', text: 'Weekly sales report is ready', createdAt: '2026-10-30T08:00:00.000Z', read: true },
  ];
}

module.exports = { seedOrders, seedNotifications };

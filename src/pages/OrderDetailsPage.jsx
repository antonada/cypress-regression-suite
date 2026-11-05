import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, describeError } from '../lib/api';
import { formatDate, formatMoney, STATUS_LABELS } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState } from '../components/States';
import { useToast } from '../components/Toast';

export function OrderDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null });
  const requestKey = `${id}#${attempt}`;
  const state = result.key === requestKey ? result : { status: 'loading' };
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .getOrder(id, controller.signal)
      .then((order) => {
        setResult({ key: requestKey, status: 'ready', order });
        setNewStatus(order.status);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.status === 401) return;
        setResult({ key: requestKey, status: 'error', error: err });
      });
    return () => controller.abort();
    // requestKey already covers id and attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  async function saveStatus() {
    const { order } = state;
    setSaving(true);
    try {
      const updated = await api.updateStatus(order.id, newStatus);
      setResult({ key: requestKey, status: 'ready', order: updated });
      toast(`${order.id} marked as ${STATUS_LABELS[updated.status]}`);
    } catch (err) {
      if (err.status !== 401) {
        setNewStatus(order.status);
        toast("Couldn't update the status. Please try again.", 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  const back = (
    <Link to="/orders" className="back-link">
      Back to orders
    </Link>
  );

  if (state.status === 'loading') {
    return (
      <main className="page">
        {back}
        <p className="muted" data-cy="order-loading">
          Loading order...
        </p>
      </main>
    );
  }

  if (state.status === 'error') {
    const { error } = state;
    return (
      <main className="page">
        {back}
        {error.status === 404 && (
          <EmptyState
            cy="order-not-found"
            title="Order not found"
            message={`There's no order with the number ${id}.`}
          />
        )}
        {error.status === 403 && (
          <EmptyState
            cy="order-forbidden"
            title="You don't have access to this order"
            message="Ask an account owner to give you access."
          />
        )}
        {error.status !== 404 && error.status !== 403 && (
          <ErrorState
            cy="order-error"
            title="Couldn't load this order"
            message={describeError(error)}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        )}
      </main>
    );
  }

  const { order } = state;
  const items = order.items ?? [];

  return (
    <main className="page">
      {back}
      <div className="page__head">
        <h1 data-cy="order-title">{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="details">
        <section className="card" aria-label="Items">
          {items.length === 0 ? (
            <p className="muted" data-cy="order-items-empty">
              This order has no items.
            </p>
          ) : (
            <table className="table" data-cy="order-items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="right">Qty</th>
                  <th className="right">Price</th>
                  <th className="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} data-cy="order-item">
                    <td>{item.name}</td>
                    <td className="right">{item.quantity}</td>
                    <td className="right">{formatMoney(item.unitPrice)}</td>
                    <td className="right">{formatMoney(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="details__total">
            Total <strong data-cy="order-total">{formatMoney(order.total)}</strong>
          </p>
        </section>

        <aside className="card details__side">
          <h2>Customer</h2>
          <p data-cy="customer-name">{order.customer?.name || 'Unknown customer'}</p>
          <p className="muted" data-cy="customer-email">
            {order.customer?.email || 'No email on file'}
          </p>
          <p className="muted">Placed {formatDate(order.createdAt)}</p>

          <h2>Status</h2>
          <label htmlFor="status" className="visually-hidden">
            Order status
          </label>
          <select id="status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} data-cy="status-select">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button button--wide"
            disabled={saving || newStatus === order.status}
            onClick={saveStatus}
            data-cy="save-status"
          >
            {saving ? 'Saving...' : 'Update status'}
          </button>
        </aside>
      </div>
    </main>
  );
}

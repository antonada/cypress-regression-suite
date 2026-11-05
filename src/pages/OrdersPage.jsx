import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, describeError } from '../lib/api';
import { formatDate, formatMoney, STATUS_LABELS } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, TableSkeleton } from '../components/States';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 400;

const SORT_OPTIONS = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  total_desc: 'Total: high to low',
  total_asc: 'Total: low to high',
};

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Math.max(Number(params.get('page')) || 1, 1);

  const [search, setSearch] = useState(q);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null });
  const latestRequest = useRef(0);

  // A result only counts for the request it was fetched for, anything else means we're still loading
  const requestKey = JSON.stringify({ q, status, sort, page, attempt });
  const state = result.key === requestKey ? result : { status: 'loading' };

  function updateParams(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value === null || (key === 'page' && value === 1) || (key === 'sort' && value === 'newest')) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    setParams(next);
  }

  // Wait until the user stops typing before hitting the API
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => updateParams({ q: search.trim(), page: 1 }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++latestRequest.current;

    const query = { page, pageSize: PAGE_SIZE };
    if (q) query.q = q;
    if (status) query.status = status;
    if (sort !== 'newest') query.sort = sort;

    api
      .listOrders(query, controller.signal)
      .then((data) => {
        if (requestId === latestRequest.current) setResult({ key: requestKey, status: 'ready', data });
      })
      .catch((err) => {
        if (err.name === 'AbortError' || requestId !== latestRequest.current) return;
        if (err.status === 401) return;
        setResult({ key: requestKey, status: 'error', message: describeError(err) });
      });

    return () => controller.abort();
    // requestKey already covers q, status, sort, page and attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const hasFilters = Boolean(q || status);

  function clearFilters() {
    setSearch('');
    updateParams({ q: '', status: '', page: 1 });
  }

  return (
    <main className="page">
      <div className="page__head">
        <h1>Orders</h1>
        <Link to="/orders/new" className="button" data-cy="new-order">
          New order
        </Link>
      </div>

      <div className="toolbar" data-cy="orders-toolbar">
        <input
          type="search"
          aria-label="Search orders"
          placeholder="Search by order number, customer or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-cy="search"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
          data-cy="status-filter"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort orders"
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
          data-cy="sort"
        >
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {state.status === 'loading' && <TableSkeleton />}

      {state.status === 'error' && (
        <ErrorState
          cy="orders-error"
          title="Couldn't load orders"
          message={state.message}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}

      {state.status === 'ready' && state.data.total === 0 && !hasFilters && (
        <EmptyState
          cy="orders-empty"
          title="No orders yet"
          message="Orders will show up here as soon as customers start buying."
          action={
            <Link to="/orders/new" className="button">
              Create the first order
            </Link>
          }
        />
      )}

      {state.status === 'ready' && state.data.total === 0 && hasFilters && (
        <EmptyState
          cy="orders-no-results"
          title="No orders match your filters"
          message="Try a different search or clear the filters."
          action={
            <button type="button" className="button button--secondary" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      )}

      {state.status === 'ready' && state.data.total > 0 && (
        <OrdersTable data={state.data} page={page} onPage={(p) => updateParams({ page: p })} />
      )}
    </main>
  );
}

function OrdersTable({ data, page, onPage }) {
  const pages = Math.max(Math.ceil(data.total / PAGE_SIZE), 1);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + data.items.length - 1;

  return (
    <>
      <div className="card">
        <table className="table" data-cy="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th className="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.id} data-cy="order-row">
                <td>
                  <Link to={`/orders/${order.id}`} data-cy="order-link">
                    {order.id}
                  </Link>
                </td>
                <td data-cy="order-customer">{order.customer?.name || 'Unknown customer'}</td>
                <td data-cy="order-date">{formatDate(order.createdAt)}</td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td className="right" data-cy="order-total">
                  {formatMoney(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span data-cy="orders-summary">
          {data.items.length > 0 ? `Showing ${from} to ${to} of ${data.total} orders` : `${data.total} orders`}
        </span>
        <div className="pagination__controls">
          <button
            type="button"
            className="button button--secondary"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            data-cy="prev-page"
          >
            Previous
          </button>
          <span data-cy="page-indicator">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="button button--secondary"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
            data-cy="next-page"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

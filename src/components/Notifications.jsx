import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';

export function Notifications() {
  const [state, setState] = useState({ status: 'loading', items: [] });
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    let active = true;
    api
      .notifications()
      .then((data) => active && setState({ status: 'ready', items: data.items ?? [] }))
      .catch(() => active && setState({ status: 'error', items: [] }));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const unread = state.items.filter((n) => !n.read).length;

  return (
    <div className="notifications" ref={wrapper}>
      <button
        type="button"
        className="icon-button"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        data-cy="notifications-button"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"
          />
        </svg>
        {unread > 0 && (
          <span className="count" data-cy="notifications-count">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notifications__panel" data-cy="notifications-panel">
          <h2>Notifications</h2>
          {state.status === 'loading' && <p className="muted">Loading...</p>}
          {state.status === 'error' && (
            <p className="muted" data-cy="notifications-error">
              Couldn't load notifications right now.
            </p>
          )}
          {state.status === 'ready' && state.items.length === 0 && (
            <p className="muted" data-cy="notifications-empty">
              You're all caught up.
            </p>
          )}
          {state.items.length > 0 && (
            <ul>
              {state.items.map((n) => (
                <li key={n.id} className={n.read ? '' : 'unread'} data-cy="notification">
                  <span>{n.text}</span>
                  <small>{formatDate(n.createdAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

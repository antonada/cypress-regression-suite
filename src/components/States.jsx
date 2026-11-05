export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="skeleton" data-cy="orders-skeleton" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__row" />
      ))}
    </div>
  );
}

export function ErrorState({ title, message, onRetry, cy }) {
  return (
    <div className="state state--error" role="alert" data-cy={cy}>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action, cy }) {
  return (
    <div className="state" data-cy={cy}>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

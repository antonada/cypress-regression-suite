import { STATUS_LABELS } from '../lib/format';

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge--${status ?? 'unknown'}`} data-cy="status-badge">
      {STATUS_LABELS[status] ?? 'Unknown'}
    </span>
  );
}

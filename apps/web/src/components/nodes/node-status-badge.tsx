import type { NodeRecord } from '@llmtrap/shared';

const statusStyles: Record<NodeRecord['status'], string> = {
  DISABLED: 'border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-[var(--color-text-tertiary)]',
  OFFLINE: 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  ONLINE: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)] pulse-online',
  PENDING: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]',
};

export function NodeStatusBadge({ status }: Pick<NodeRecord, 'status'>) {
  return (
    <span className={`inline-flex border rounded-[var(--radius-full)] px-2 py-1 text-xs font-bold tracking-widest ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

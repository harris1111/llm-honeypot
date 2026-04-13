import type { NodeRecord } from '@llmtrap/shared';

const statusStyles: Record<NodeRecord['status'], string> = {
  DISABLED: 'border-stone-600 bg-stone-700/40 text-stone-200',
  OFFLINE: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  ONLINE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  PENDING: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
};

export function NodeStatusBadge({ status }: Pick<NodeRecord, 'status'>) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.15em] ${statusStyles[status]}`}>{status}</span>;
}
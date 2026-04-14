import type { NodeRecord } from '@llmtrap/shared';
import { Link } from '@tanstack/react-router';

import { NodeStatusBadge } from './node-status-badge';

export function NodeCard({ node }: { node: NodeRecord }) {
  return (
    <article className="border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-4 rounded-[var(--radius-lg)] transition hover:border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)]">{node.nodeKeyPrefix}</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{node.name}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{node.hostname ?? node.publicIp ?? 'no host'}</p>
        </div>
        <NodeStatusBadge status={node.status} />
      </div>
      <dl className="mt-3 grid gap-3 text-xs text-[var(--color-text-secondary)] sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-text-tertiary)]">IP</dt>
          <dd>{node.publicIp ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-tertiary)]">Heartbeat</dt>
          <dd>{node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleString() : '—'}</dd>
        </div>
      </dl>
      <Link
        className="mt-4 inline-flex border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-accent)]"
        params={{ nodeId: node.id }}
        to="/nodes/$nodeId"
      >
        Inspect
      </Link>
    </article>
  );
}

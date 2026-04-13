import type { NodeRecord } from '@llmtrap/shared';
import { Link } from '@tanstack/react-router';

import { NodeStatusBadge } from './node-status-badge';

export function NodeCard({ node }: { node: NodeRecord }) {
  return (
    <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{node.nodeKeyPrefix}</p>
          <h3 className="mt-2 text-lg font-semibold text-stone-50">{node.name}</h3>
          <p className="mt-1 text-sm text-stone-400">{node.hostname || node.publicIp || 'No host metadata yet'}</p>
        </div>
        <NodeStatusBadge status={node.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Public IP</dt>
          <dd>{node.publicIp ?? 'Pending registration'}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Last heartbeat</dt>
          <dd>{node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleString() : 'No heartbeat yet'}</dd>
        </div>
      </dl>
      <Link
        className="mt-5 inline-flex rounded-2xl border border-stone-700 px-4 py-2 text-sm text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
        params={{ nodeId: node.id }}
        to="/nodes/$nodeId"
      >
        Inspect node
      </Link>
    </article>
  );
}
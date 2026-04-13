import { useParams } from '@tanstack/react-router';

import { NodeStatusBadge } from '../components/nodes/node-status-badge';
import { NodeConfigForm } from '../components/nodes/node-config-form';
import { useApproveNode, useNode, useUpdateNode } from '../hooks/use-nodes';
import { useResponseConfig } from '../hooks/use-response-config';

export function NodeDetailRouteView() {
  const { nodeId } = useParams({ strict: false }) as { nodeId: string };
  const nodeQuery = useNode(nodeId);
  const approveNode = useApproveNode();
  const responseConfigQuery = useResponseConfig(nodeId);
  const updateNode = useUpdateNode();
  const node = nodeQuery.data;
  const responseConfig = responseConfigQuery.data;

  if (!node) {
    return <p className="text-sm text-stone-400">Loading node…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Node detail</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-50">{node.name}</h2>
          <p className="mt-2 text-sm text-stone-400">Key prefix {node.nodeKeyPrefix}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NodeStatusBadge status={node.status} />
          {node.status === 'PENDING' ? (
            <button
              className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-sky-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
              disabled={approveNode.isPending}
              onClick={() => approveNode.mutate(node.id)}
              type="button"
            >
              {approveNode.isPending ? 'Approving…' : 'Approve node'}
            </button>
          ) : null}
        </div>
      </div>

      <NodeConfigForm
        isSubmitting={updateNode.isPending}
        node={node}
        onSubmit={async (input) => {
          await updateNode.mutateAsync({ input, nodeId: node.id });
        }}
      />

      <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Response engine</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-50">Current strategy chain</h3>
          </div>
          {responseConfigQuery.isLoading ? <span className="text-sm text-stone-400">Loading…</span> : null}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
            <p className="text-sm text-stone-400">Strategies</p>
            <p className="mt-2 text-base font-medium text-stone-50">{responseConfig?.strategyChain.join(' -> ') ?? 'smart -> fixed_n -> budget'}</p>
            <p className="mt-3 text-sm text-stone-400">Fixed-N threshold: {responseConfig?.fixedN.n ?? 3}</p>
            <p className="mt-1 text-sm text-stone-400">Monthly budget: ${responseConfig?.budget.monthlyLimitUsd ?? 5}</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
            <p className="text-sm text-stone-400">Proxy target</p>
            <p className="mt-2 text-base font-medium text-stone-50">{responseConfig?.proxy.model || 'No proxy model configured'}</p>
            <p className="mt-3 break-all text-sm text-stone-400">{responseConfig?.proxy.baseUrl || 'Proxy disabled'}</p>
            <p className="mt-3 text-sm text-stone-400">Backfeed enabled: {responseConfig?.backfeed.enabled ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
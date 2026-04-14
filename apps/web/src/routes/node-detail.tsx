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
    return <p className="text-xs text-[var(--color-text-tertiary)]">...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{node.name}</h1>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{node.nodeKeyPrefix}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NodeStatusBadge status={node.status} />
          {node.status === 'PENDING' ? (
            <button
              className="border border-[var(--color-info-border)] rounded-[var(--radius-md)] bg-[var(--color-info-bg)] px-3 py-2 text-xs font-medium text-[var(--color-info)] transition hover:bg-[var(--color-info-bg)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
              disabled={approveNode.isPending}
              onClick={() => approveNode.mutate(node.id)}
              type="button"
            >
              {approveNode.isPending ? 'Approving...' : 'Approve'}
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

      <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Response engine</h2>
          {responseConfigQuery.isLoading ? <span className="text-xs text-[var(--color-text-tertiary)]">...</span> : null}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
            <p className="text-xs text-[var(--color-text-tertiary)]">Strategy chain</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-accent)]">{responseConfig?.strategyChain.join(' → ') ?? 'smart → fixed_n → budget'}</p>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">fixed_n: {responseConfig?.fixedN.n ?? 3}</p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">budget: ${responseConfig?.budget.monthlyLimitUsd ?? 5}/mo</p>
          </div>
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
            <p className="text-xs text-[var(--color-text-tertiary)]">Proxy</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{responseConfig?.proxy.model || 'no proxy model'}</p>
            <p className="mt-2 break-all text-xs text-[var(--color-text-tertiary)]">{responseConfig?.proxy.baseUrl || 'disabled'}</p>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">backfeed: {responseConfig?.backfeed.enabled ? 'on' : 'off'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

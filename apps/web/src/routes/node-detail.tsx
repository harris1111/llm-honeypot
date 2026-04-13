import { useParams } from '@tanstack/react-router';

import { NodeStatusBadge } from '../components/nodes/node-status-badge';
import { NodeConfigForm } from '../components/nodes/node-config-form';
import { useApproveNode, useNode, useUpdateNode } from '../hooks/use-nodes';

export function NodeDetailRouteView() {
  const { nodeId } = useParams({ strict: false }) as { nodeId: string };
  const nodeQuery = useNode(nodeId);
  const approveNode = useApproveNode();
  const updateNode = useUpdateNode();
  const node = nodeQuery.data;

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
    </div>
  );
}
import { useNodes } from '../hooks/use-nodes';

export function OverviewRouteView() {
  const nodesQuery = useNodes();
  const nodes = nodesQuery.data ?? [];
  const onlineCount = nodes.filter((node) => node.status === 'ONLINE').length;
  const pendingCount = nodes.filter((node) => node.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Operator snapshot</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Registered nodes', value: nodes.length },
          { label: 'Online nodes', value: onlineCount },
          { label: 'Pending approval', value: pendingCount },
        ].map((item) => (
          <article key={item.label} className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm text-stone-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-stone-50">{item.value}</p>
          </article>
        ))}
      </div>
      <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
        <h3 className="text-lg font-semibold text-stone-50">Status</h3>
        <p className="mt-2 text-sm text-stone-400">
          {nodesQuery.isLoading ? 'Loading node inventory…' : 'The dashboard control plane is ready for node registration, approval, and config edits.'}
        </p>
      </article>
    </div>
  );
}
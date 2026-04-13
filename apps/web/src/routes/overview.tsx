import { useAnalyticsOverview } from '../hooks/use-analytics';

export function OverviewRouteView() {
  const analyticsQuery = useAnalyticsOverview();
  const overview = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Operator snapshot</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Registered nodes', value: overview?.nodes.total ?? '...' },
          { label: 'Captured sessions', value: overview?.sessions.total ?? '...' },
          { label: 'Captured requests', value: overview?.captures.total ?? '...' },
        ].map((item) => (
          <article key={item.label} className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm text-stone-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-stone-50">{item.value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Node state</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
              <p className="text-sm text-stone-400">Online nodes</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-200">{overview?.nodes.online ?? '...'}</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
              <p className="text-sm text-stone-400">Pending approval</p>
              <p className="mt-2 text-2xl font-semibold text-sky-200">{overview?.nodes.pending ?? '...'}</p>
            </div>
          </div>
        </article>
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Top services</h3>
          <div className="mt-4 space-y-3">
            {(overview?.topServices ?? []).map((service) => (
              <div key={service.service} className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                <span className="text-sm text-stone-200">{service.service}</span>
                <span className="text-sm font-medium text-stone-50">{service.count}</span>
              </div>
            ))}
            {analyticsQuery.isLoading ? <p className="text-sm text-stone-400">Loading analytics…</p> : null}
          </div>
        </article>
      </div>
    </div>
  );
}
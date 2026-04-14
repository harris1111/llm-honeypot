import { useAnalyticsOverview } from '../hooks/use-analytics';

export function OverviewRouteView() {
  const analyticsQuery = useAnalyticsOverview();
  const overview = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Nodes', value: overview?.nodes.total ?? '...' },
          { label: 'Sessions', value: overview?.sessions.total ?? '...' },
          { label: 'Requests', value: overview?.captures.total ?? '...' },
        ].map((item) => (
          <article key={item.label} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
            <p className="text-xs text-[var(--color-text-tertiary)]">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-accent)]">{item.value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Node state</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
              <p className="text-xs text-[var(--color-text-tertiary)]">Online</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-accent)]">{overview?.nodes.online ?? '...'}</p>
            </div>
            <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
              <p className="text-xs text-[var(--color-text-tertiary)]">Pending</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-info)]">{overview?.nodes.pending ?? '...'}</p>
            </div>
          </div>
        </article>
        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Top services</h2>
          <div className="mt-3 space-y-2">
            {(overview?.topServices ?? []).map((service) => (
              <div key={service.service} className="flex items-center justify-between border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2">
                <span className="text-xs text-[var(--color-text-secondary)]">{service.service}</span>
                <span className="text-xs font-medium text-[var(--color-accent)]">{service.count}</span>
              </div>
            ))}
            {analyticsQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
          </div>
        </article>
      </div>
    </div>
  );
}

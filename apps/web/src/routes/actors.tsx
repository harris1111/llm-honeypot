import { useActors } from '../hooks/use-actors';

export function ActorsRouteView() {
  const actorsQuery = useActors();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Actors</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {(actorsQuery.data ?? []).map((actor) => (
          <article key={actor.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 transition hover:border-[var(--color-border-strong)]">
            <p className="text-xs text-[var(--color-text-tertiary)]">{actor.label ?? actor.id}</p>
            <p className="mt-1.5 text-lg font-bold text-[var(--color-accent)]">
              {actor.sessionCount} <span className="text-sm font-normal text-[var(--color-text-tertiary)]">sessions</span>
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">services: {actor.recentServices.join(', ') || 'none'}</p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">ips: {actor.sourceIps.join(', ') || 'none'}</p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">agents: {actor.userAgents.join(', ') || 'none'}</p>
          </article>
        ))}
        {actorsQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
        {!actorsQuery.isLoading && !actorsQuery.data?.length ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No actors yet.</p>
        ) : null}
      </div>
    </div>
  );
}

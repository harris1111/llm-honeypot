import { useActors } from '../hooks/use-actors';

export function ActorsRouteView() {
  const actorsQuery = useActors();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Actors</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Correlated operators and repeat scanners</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(actorsQuery.data ?? []).map((actor) => (
          <article key={actor.id} className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{actor.label ?? actor.id}</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-50">{actor.sessionCount} sessions</h3>
            <p className="mt-3 text-sm text-stone-400">Services: {actor.recentServices.join(', ') || 'none'}</p>
            <p className="mt-2 text-sm text-stone-400">IPs: {actor.sourceIps.join(', ') || 'none'}</p>
            <p className="mt-2 text-sm text-stone-400">User agents: {actor.userAgents.join(', ') || 'none captured'}</p>
          </article>
        ))}
        {actorsQuery.isLoading ? <p className="text-sm text-stone-400">Loading actors…</p> : null}
      </div>
    </div>
  );
}
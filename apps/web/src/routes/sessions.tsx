import { useSessions } from '../hooks/use-sessions';

export function SessionsRouteView() {
  const sessionsQuery = useSessions();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Sessions</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Recent interaction timelines</h2>
      </div>
      <div className="space-y-3">
        {(sessionsQuery.data ?? []).map((session) => (
          <article key={session.id} className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-stone-50">{session.service} from {session.sourceIp}</p>
                <p className="mt-1 text-sm text-stone-400">Started {new Date(session.startedAt).toLocaleString()} • {session.requestCount} requests</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-stone-300">
                <span className="rounded-full border border-stone-700 px-3 py-1">{session.classification ?? 'unknown'}</span>
                <span className="rounded-full border border-stone-700 px-3 py-1">node {session.nodeId}</span>
              </div>
            </div>
          </article>
        ))}
        {sessionsQuery.isLoading ? <p className="text-sm text-stone-400">Loading sessions…</p> : null}
      </div>
    </div>
  );
}
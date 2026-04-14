import { useSessions } from '../hooks/use-sessions';

export function SessionsRouteView() {
  const sessionsQuery = useSessions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Sessions</h1>
      <div className="stagger-children space-y-2">
        {(sessionsQuery.data ?? []).map((session) => (
          <article key={session.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {session.service} <span className="text-[var(--color-text-tertiary)]">from</span> {session.sourceIp}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {new Date(session.startedAt).toLocaleString()} &middot; {session.requestCount} requests
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-1 text-[var(--color-text-secondary)]">
                  {session.classification ?? 'unknown'}
                </span>
                <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-1 text-[var(--color-text-secondary)]">
                  {session.nodeId}
                </span>
              </div>
            </div>
          </article>
        ))}
        {sessionsQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
        {!sessionsQuery.isLoading && !sessionsQuery.data?.length ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No sessions yet.</p>
        ) : null}
      </div>
    </div>
  );
}

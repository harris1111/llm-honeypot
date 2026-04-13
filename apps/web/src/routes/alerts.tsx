import { useAlertLogs, useAlertRules } from '../hooks/use-alerts';

export function AlertsRouteView() {
  const rulesQuery = useAlertRules();
  const logsQuery = useAlertLogs();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Alerts</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Rule definitions and delivery history</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Rules</h3>
          <div className="mt-4 space-y-3">
            {(rulesQuery.data ?? []).map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone-50">{rule.name}</p>
                  <span className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">{rule.severity}</span>
                </div>
                <p className="mt-2 text-sm text-stone-400">Channels: {rule.channels.join(', ') || 'none'}</p>
              </div>
            ))}
            {rulesQuery.isLoading ? <p className="text-sm text-stone-400">Loading alert rules…</p> : null}
          </div>
        </article>
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Recent deliveries</h3>
          <div className="mt-4 space-y-3">
            {(logsQuery.data ?? []).map((log) => (
              <div key={log.id} className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                <p className="text-sm font-medium text-stone-50">{log.channel}</p>
                <p className="mt-1 text-sm text-stone-400">{new Date(log.sentAt).toLocaleString()} • {log.success ? 'sent' : 'failed'}</p>
              </div>
            ))}
            {logsQuery.isLoading ? <p className="text-sm text-stone-400">Loading alert logs…</p> : null}
          </div>
        </article>
      </div>
    </div>
  );
}
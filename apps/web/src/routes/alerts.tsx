import { useAlertLogs, useAlertRules } from '../hooks/use-alerts';

function severityBadgeClass(severity: string) {
  if (severity === 'critical') {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  }

  if (severity === 'warning') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }

  return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
}

export function AlertsRouteView() {
  const rulesQuery = useAlertRules();
  const logsQuery = useAlertLogs();
  const failedDeliveries = (logsQuery.data ?? []).filter((log) => !log.success).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-800 bg-gradient-to-br from-stone-950 via-stone-950 to-rose-950/20 p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Alerts</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-50">Rule definitions and delivery history</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Internal logs stay available, and webhook delivery attempts now record success or failure details for operator review.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[26rem]">
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Rules</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{rulesQuery.data?.length ?? 0}</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Deliveries</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{logsQuery.data?.length ?? 0}</p>
            </div>
            <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-rose-200/80">Failures</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{failedDeliveries}</p>
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Rules</h3>
          <div className="mt-4 space-y-3">
            {(rulesQuery.data ?? []).map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone-50">{rule.name}</p>
                  <span className={`rounded-full border px-3 py-1 text-xs ${severityBadgeClass(rule.severity)}`}>{rule.severity}</span>
                </div>
                <p className="mt-2 text-sm text-stone-400">Channels: {rule.channels.join(', ') || 'none'}</p>
              </div>
            ))}
            {rulesQuery.isLoading ? <p className="text-sm text-stone-400">Loading alert rules…</p> : null}
            {rulesQuery.error ? <p className="text-sm text-rose-200">{rulesQuery.error.message}</p> : null}
            {!rulesQuery.isLoading && !rulesQuery.error && !rulesQuery.data?.length ? <p className="text-sm text-stone-400">No alert rules are configured yet.</p> : null}
          </div>
        </article>
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Recent deliveries</h3>
          <div className="mt-4 space-y-3">
            {(logsQuery.data ?? []).map((log) => (
              <div key={log.id} className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-50">{log.ruleName} • {log.channel}</p>
                    <p className="mt-1 text-sm text-stone-400">
                      {log.sourceIp ?? 'unknown source'} • {log.service ?? 'unknown service'} • {log.classification ?? 'unclassified'}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${log.success ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
                    {log.deliveryStatus}
                  </span>
                </div>
                <p className="mt-3 text-sm text-stone-400">
                  {new Date(log.sentAt).toLocaleString()}
                  {log.deliveryStatusCode ? ` • HTTP ${log.deliveryStatusCode}` : ''}
                  {log.requestCount ? ` • ${log.requestCount} requests` : ''}
                </p>
                {log.deliveryDetail ? <p className="mt-2 text-sm text-stone-300">{log.deliveryDetail}</p> : null}
                {log.paths.length > 0 ? <p className="mt-2 text-xs text-stone-500">Paths: {log.paths.join(', ')}</p> : null}
              </div>
            ))}
            {logsQuery.isLoading ? <p className="text-sm text-stone-400">Loading alert logs…</p> : null}
            {logsQuery.error ? <p className="text-sm text-rose-200">{logsQuery.error.message}</p> : null}
            {!logsQuery.isLoading && !logsQuery.error && !logsQuery.data?.length ? <p className="text-sm text-stone-400">No alert deliveries have been recorded yet.</p> : null}
          </div>
        </article>
      </div>
    </div>
  );
}
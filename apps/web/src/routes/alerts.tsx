import { useAlertLogs, useAlertRules } from '../hooks/use-alerts';

function severityBadgeClass(severity: string) {
  if (severity === 'critical') {
    return 'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error)]';
  }

  if (severity === 'warning') {
    return 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
  }

  return 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]';
}

export function AlertsRouteView() {
  const rulesQuery = useAlertRules();
  const logsQuery = useAlertLogs();
  const failedDeliveries = (logsQuery.data ?? []).filter((log) => !log.success).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Alerts</h1>
        <div className="flex gap-4 text-xs text-[var(--color-text-tertiary)]">
          <span>{rulesQuery.data?.length ?? 0} rules</span>
          <span>{logsQuery.data?.length ?? 0} deliveries</span>
          {failedDeliveries > 0 ? (
            <span className="text-[var(--color-error)]">{failedDeliveries} failed</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Rules</h2>
          <div className="mt-3 space-y-2">
            {(rulesQuery.data ?? []).map((rule) => (
              <div key={rule.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{rule.name}</p>
                  <span className={`border rounded-[var(--radius-full)] px-2 py-0.5 text-xs font-bold tracking-widest ${severityBadgeClass(rule.severity)}`}>
                    {rule.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{rule.channels.join(', ') || 'no channels'}</p>
              </div>
            ))}
            {rulesQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
            {rulesQuery.error ? <p className="text-xs text-[var(--color-error)]">{rulesQuery.error.message}</p> : null}
            {!rulesQuery.isLoading && !rulesQuery.error && !rulesQuery.data?.length ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">No rules configured.</p>
            ) : null}
          </div>
        </article>

        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Deliveries</h2>
          <div className="mt-3 space-y-2">
            {(logsQuery.data ?? []).map((log) => (
              <div key={log.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{log.ruleName} &middot; {log.channel}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                      {log.sourceIp ?? 'unknown'} &middot; {log.service ?? 'unknown'} &middot; {log.classification ?? 'unclassified'}
                    </p>
                  </div>
                  <span className={`border rounded-[var(--radius-full)] px-2 py-0.5 text-xs font-bold tracking-widest ${log.success ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error)]'}`}>
                    {log.deliveryStatus}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                  {new Date(log.sentAt).toLocaleString()}
                  {log.deliveryStatusCode ? ` · HTTP ${log.deliveryStatusCode}` : ''}
                  {log.requestCount ? ` · ${log.requestCount} req` : ''}
                </p>
                {log.deliveryDetail ? <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{log.deliveryDetail}</p> : null}
                {log.paths.length > 0 ? <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{log.paths.join(', ')}</p> : null}
              </div>
            ))}
            {logsQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
            {logsQuery.error ? <p className="text-xs text-[var(--color-error)]">{logsQuery.error.message}</p> : null}
            {!logsQuery.isLoading && !logsQuery.error && !logsQuery.data?.length ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">No deliveries yet.</p>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

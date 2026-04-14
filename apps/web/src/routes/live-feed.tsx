import { useMemo, useState } from 'react';

import type { LiveFeedFilters } from '../lib/api-client';
import { useLiveFeed } from '../hooks/use-live-feed';

const FILTER_FIELDS: Array<{
  key: 'classification' | 'service' | 'nodeId' | 'sourceIp';
  label: string;
  placeholder: string;
}> = [
  { key: 'classification', label: 'Classification', placeholder: 'attacker...' },
  { key: 'service', label: 'Service', placeholder: 'openai...' },
  { key: 'nodeId', label: 'Node ID', placeholder: 'node-1...' },
  { key: 'sourceIp', label: 'Source IP', placeholder: '203.0.113.10...' },
];

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

function statusBadgeClass(status: 'connected' | 'connecting' | 'disabled' | 'polling') {
  if (status === 'connected') return 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]';
  if (status === 'connecting') return 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]';
  if (status === 'polling') return 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
  return 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]';
}

function toggleButtonClass(enabled: boolean) {
  return enabled
    ? 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)] hover:border-[var(--color-info-border)]'
    : 'border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]';
}

export function LiveFeedRouteView() {
  const [filters, setFilters] = useState<LiveFeedFilters>({});
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [websocketEnabled, setWebsocketEnabled] = useState(false);
  const feedQuery = useLiveFeed({ filters, pollingEnabled, websocketEnabled });
  const events = feedQuery.data?.events ?? [];
  const connectionState = feedQuery.data?.connectionState ?? (pollingEnabled ? 'polling' : 'disabled');
  const connectionLabel =
    connectionState === 'connected' ? 'ws:connected'
      : connectionState === 'connecting' ? 'ws:connecting'
        : connectionState === 'polling' ? 'poll:active'
          : 'manual';
  const recentEvents = useMemo(
    () => events.filter((event) => Date.now() - new Date(event.timestamp).getTime() <= 60_000).length,
    [events],
  );
  const activeFilterCount = Object.values(filters).filter((value) => typeof value === 'string' && value.trim().length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Live Feed</h1>
        <span className={`border rounded-[var(--radius-full)] px-2 py-1 text-xs font-bold uppercase tracking-widest ${statusBadgeClass(connectionState)}`}>
          {connectionLabel}
        </span>
      </div>

      {/* Transport controls */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid gap-3 sm:grid-cols-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          {[
            { label: 'Events', value: events.length },
            { label: 'Past 60s', value: recentEvents },
            { label: 'Filters', value: activeFilterCount },
          ].map((item) => (
            <div key={item.label} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
              <p className="text-xs text-[var(--color-text-tertiary)]">{item.label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--color-accent)]">{item.value}</p>
            </div>
          ))}
        </div>

        <aside className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Transport</h2>
          <div className="mt-3 space-y-2">
            {[
              { label: 'REST polling', enabled: pollingEnabled, onToggle: () => setPollingEnabled((v) => !v) },
              { label: 'WebSocket', enabled: websocketEnabled, onToggle: () => setWebsocketEnabled((v) => !v) },
            ].map((control) => (
              <div key={control.label} className="flex items-center justify-between border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-3 py-2">
                <p className="text-xs text-[var(--color-text-secondary)]">{control.label}</p>
                <button
                  aria-pressed={control.enabled}
                  className={`border rounded-[var(--radius-md)] px-3 py-1 text-xs font-medium transition ${toggleButtonClass(control.enabled)}`}
                  onClick={control.onToggle}
                  type="button"
                >
                  {control.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
          {feedQuery.data?.connectionError ? (
            <p aria-live="polite" className="mt-3 border border-[var(--color-warning-border)] rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs text-[var(--color-warning)]">
              ws fallback: {feedQuery.data.connectionError}
            </p>
          ) : null}
        </aside>
      </div>

      {/* Filters */}
      <section className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {FILTER_FIELDS.map((field) => (
            <label key={field.key} className="space-y-1.5 text-xs">
              <span className="text-xs text-[var(--color-text-tertiary)]">{field.label}</span>
              <input
                autoComplete="off"
                className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
                name={field.key}
                onChange={(event) => setFilters((c) => ({ ...c, [field.key]: event.target.value }))}
                placeholder={field.placeholder}
                spellCheck={false}
                value={filters[field.key] ?? ''}
              />
            </label>
          ))}
        </div>
      </section>

      {/* Event list */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Events</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {feedQuery.isLoading ? '...' : events.length ? 'Newest first.' : 'Waiting for traffic.'}
          </p>
        </div>
        <div className="stagger-children space-y-2">
        {events.map((event) => (
          <article key={event.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-3 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="border border-[var(--color-info-border)] rounded-[var(--radius-md)] bg-[var(--color-info-bg)] px-2 py-0.5 text-xs font-bold tracking-widest text-[var(--color-info)]">
                    {event.method}
                  </span>
                  <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                    {event.service}
                  </span>
                  <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs uppercase tracking-widest text-[var(--color-text-tertiary)]">
                    {event.classification ?? 'unclassified'}
                  </span>
                </div>
                <p className="mt-2 break-all text-sm text-[var(--color-accent)]">{event.path ?? '/'}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Node', value: event.nodeId },
                    { label: 'Actor', value: event.actorId ?? 'unknown' },
                    { label: 'IP', value: event.sourceIp },
                    { label: 'Strategy', value: event.strategy ?? 'unknown' },
                  ].map((item) => (
                    <div key={item.label} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-2.5 py-2">
                      <p className="text-xs text-[var(--color-text-tertiary)]">{item.label}</p>
                      <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-w-0 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-3 py-2 xl:w-52">
                <p className="text-xs text-[var(--color-text-tertiary)]">Captured</p>
                <time className="mt-1 block text-xs font-medium tabular-nums text-[var(--color-text-primary)]" dateTime={event.timestamp}>
                  {TIMESTAMP_FORMATTER.format(new Date(event.timestamp))}
                </time>
                <span className="mt-2 inline-block border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                  HTTP {event.responseCode ?? 'n/a'}
                </span>
              </div>
            </div>
            {event.userAgent ? (
              <p className="mt-3 break-all border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
                {event.userAgent}
              </p>
            ) : null}
          </article>
        ))}
        </div>
        {!feedQuery.isLoading && !events.length ? (
          <p className="border border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] px-4 py-6 text-center text-xs text-[var(--color-text-tertiary)]">
            No events match current filters.
          </p>
        ) : null}
      </section>
    </div>
  );
}

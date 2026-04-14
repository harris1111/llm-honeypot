import { useMemo, useState } from 'react';

import type { LiveFeedFilters } from '../lib/api-client';
import { useLiveFeed } from '../hooks/use-live-feed';

const FILTER_FIELDS: Array<{
  key: 'classification' | 'service' | 'nodeId' | 'sourceIp';
  label: string;
  placeholder: string;
}> = [
  { key: 'classification', label: 'Classification', placeholder: 'attacker…' },
  { key: 'service', label: 'Service', placeholder: 'openai…' },
  { key: 'nodeId', label: 'Node ID', placeholder: 'node-1…' },
  { key: 'sourceIp', label: 'Source IP', placeholder: '203.0.113.10…' },
];

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

function statusBadgeClass(status: 'connected' | 'connecting' | 'disabled' | 'polling') {
  if (status === 'connected') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  }

  if (status === 'connecting') {
    return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
  }

  if (status === 'polling') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
  }

  return 'border-stone-700 bg-stone-900 text-stone-300';
}

function toggleButtonClass(enabled: boolean) {
  return enabled
    ? 'border-sky-500/40 bg-sky-500/10 text-sky-100 hover:border-sky-400/60'
    : 'border-stone-700 bg-stone-950 text-stone-300 hover:border-stone-500';
}

export function LiveFeedRouteView() {
  const [filters, setFilters] = useState<LiveFeedFilters>({});
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [websocketEnabled, setWebsocketEnabled] = useState(false);
  const feedQuery = useLiveFeed({ filters, pollingEnabled, websocketEnabled });
  const events = feedQuery.data?.events ?? [];
  const connectionState = feedQuery.data?.connectionState ?? (pollingEnabled ? 'polling' : 'disabled');
  const connectionLabel =
    connectionState === 'connected'
      ? 'WebSocket connected'
      : connectionState === 'connecting'
        ? 'WebSocket connecting'
        : connectionState === 'polling'
          ? 'Polling fallback'
          : 'Manual refresh';
  const recentEvents = useMemo(
    () => events.filter((event) => Date.now() - new Date(event.timestamp).getTime() <= 60_000).length,
    [events],
  );
  const activeFilterCount = Object.values(filters).filter((value) => typeof value === 'string' && value.trim().length > 0).length;
  const transportSummary = `${websocketEnabled ? 'WebSocket on' : 'WebSocket off'} • ${pollingEnabled ? 'Polling on' : 'Polling off'}`;
  const summaryCards = [
    { label: 'Events on screen', value: events.length, hint: 'Latest 100 captures for the current filter set.' },
    { label: 'Past minute', value: recentEvents, hint: 'New arrivals visible within the last 60 seconds.' },
    { label: 'Active filters', value: activeFilterCount, hint: 'Filters apply to both REST queries and socket rooms.' },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="relative overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-950/80 p-5 sm:p-6">
          <div aria-hidden className="absolute right-0 top-0 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Live Feed</p>
                <h2 className="mt-2 text-3xl font-semibold text-stone-50">Recent request stream</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">
                  Watch newly ingested captures over the authenticated socket path, or keep the existing REST polling path active when realtime transport is disabled.
                </p>
              </div>
              <div className="flex flex-col gap-2" aria-live="polite">
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${statusBadgeClass(connectionState)}`}>
                  {connectionLabel}
                </span>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{transportSummary}</p>
              </div>
            </div>
            <div className="grid gap-3 border-t border-stone-800/80 pt-5 sm:grid-cols-3">
              {summaryCards.map((item) => (
                <div key={item.label} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tabular-nums text-stone-50">{item.value}</p>
                  <p className="mt-2 text-sm text-stone-400">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Transport</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-50">Realtime controls</h3>
          <p className="mt-3 text-sm leading-6 text-stone-400">Run both transports together for redundancy, or drop to manual refresh mode by disabling them both.</p>
          <div className="mt-5 space-y-3">
            {[
              {
                label: 'REST polling',
                description: 'Keeps the list warm on interval fetches.',
                enabled: pollingEnabled,
                onToggle: () => setPollingEnabled((value) => !value),
              },
              {
                label: 'WebSocket stream',
                description: 'Subscribes the dashboard to live capture pushes.',
                enabled: websocketEnabled,
                onToggle: () => setWebsocketEnabled((value) => !value),
              },
            ].map((control) => (
              <div key={control.label} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-100">{control.label}</p>
                    <p className="mt-1 text-sm text-stone-400">{control.description}</p>
                  </div>
                  <button
                    aria-pressed={control.enabled}
                    className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${toggleButtonClass(control.enabled)}`}
                    onClick={control.onToggle}
                    type="button"
                  >
                    {control.enabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {feedQuery.data?.connectionError ? (
            <p aria-live="polite" className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              WebSocket fallback active: {feedQuery.data.connectionError}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Filters</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-50">Narrow the stream</h3>
          </div>
          <p className="text-sm text-stone-400">
            <span className="font-medium tabular-nums text-stone-100">{activeFilterCount}</span> active filter{activeFilterCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {FILTER_FIELDS.map((field) => (
            <label key={field.key} className="space-y-2 text-sm text-stone-300">
              <span className="text-xs uppercase tracking-[0.2em] text-stone-500">{field.label}</span>
              <input
                autoComplete="off"
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors focus:border-stone-500 focus-visible:ring-2 focus-visible:ring-sky-500/30"
                name={field.key}
                onChange={(event) => setFilters((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder={field.placeholder}
                spellCheck={false}
                value={filters[field.key] ?? ''}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Event list</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-50">Latest captures</h3>
          </div>
          <p className="text-sm text-stone-400">{feedQuery.isLoading ? 'Loading live feed…' : events.length ? 'Newest first. Updated as captures arrive.' : 'Waiting for matching capture traffic.'}</p>
        </div>
        {events.map((event) => (
          <article key={event.id} className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4 transition-colors hover:border-stone-700/80 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100">{event.method}</span>
                  <span className="rounded-full border border-stone-700/80 bg-stone-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">{event.service}</span>
                  <span className="rounded-full border border-stone-700/80 bg-stone-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-400">{event.classification ?? 'unclassified'}</span>
                </div>
                <p className="mt-3 break-all font-mono text-sm text-stone-100 sm:text-base">{event.path ?? '/'}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Node', value: event.nodeId },
                    { label: 'Actor', value: event.actorId ?? 'unknown' },
                    { label: 'Source IP', value: event.sourceIp },
                    { label: 'Strategy', value: event.strategy ?? 'unknown' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-stone-800 bg-stone-900/60 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{item.label}</p>
                      <p className="mt-2 break-all text-sm text-stone-200">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-w-0 rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3 xl:w-60">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Captured</p>
                <time className="mt-2 block text-sm font-medium tabular-nums text-stone-100" dateTime={event.timestamp}>
                  {TIMESTAMP_FORMATTER.format(new Date(event.timestamp))}
                </time>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-300">
                  <span className="rounded-full border border-stone-700/80 px-3 py-1">HTTP {event.responseCode ?? 'n/a'}</span>
                </div>
              </div>
            </div>
            {event.userAgent ? (
              <p className="mt-4 break-all rounded-2xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-400">{event.userAgent}</p>
            ) : null}
          </article>
        ))}
        {!feedQuery.isLoading && !events.length ? (
          <p className="rounded-[1.5rem] border border-dashed border-stone-800 px-4 py-8 text-center text-sm text-stone-400">
            No capture events match the current filters yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
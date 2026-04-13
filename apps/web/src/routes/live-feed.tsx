import { useState } from 'react';

import { useLiveFeed } from '../hooks/use-live-feed';

export function LiveFeedRouteView() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const feedQuery = useLiveFeed(autoRefresh);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Live Feed</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-50">Recent request stream</h2>
        </div>
        <button
          className="rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500"
          onClick={() => setAutoRefresh((value) => !value)}
          type="button"
        >
          {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
        </button>
      </div>
      <div className="space-y-3">
        {(feedQuery.data ?? []).map((event) => (
          <article key={event.id} className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-50">{event.service} • {event.method} {event.path ?? '/'}</p>
              <p className="text-xs text-stone-400">{new Date(event.timestamp).toLocaleString()}</p>
            </div>
            <p className="mt-2 text-sm text-stone-400">{event.sourceIp} • {event.classification ?? 'unclassified'} • strategy {event.strategy ?? 'unknown'}</p>
          </article>
        ))}
        {feedQuery.isLoading ? <p className="text-sm text-stone-400">Loading live feed…</p> : null}
      </div>
    </div>
  );
}
import { useState, type FormEvent } from 'react';

import { useNodes } from '../hooks/use-nodes';
import { useThreatBlocklist, useThreatIocFeed, useThreatMitre, useThreatStix } from '../hooks/use-threat-intel';
import type { ThreatIntelFilters } from '../lib/api-client';

export function ThreatIntelRouteView() {
  const [draftFilters, setDraftFilters] = useState({
    classification: '',
    days: '',
    limit: '',
    nodeId: '',
    service: '',
    sourceIp: '',
  });
  const [filters, setFilters] = useState<ThreatIntelFilters>({});
  const nodesQuery = useNodes();
  const nodes = nodesQuery.data ?? [];
  const blocklistQuery = useThreatBlocklist(filters);
  const iocQuery = useThreatIocFeed(filters);
  const mitreQuery = useThreatMitre(filters);
  const stixQuery = useThreatStix(filters);
  const activeFilterCount = Object.values(filters).filter((value) => value !== undefined && value !== '').length;
  const queryError = nodesQuery.error ?? blocklistQuery.error ?? iocQuery.error ?? mitreQuery.error ?? stixQuery.error;

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      classification: draftFilters.classification || undefined,
      days: draftFilters.days ? Number(draftFilters.days) : undefined,
      limit: draftFilters.limit ? Number(draftFilters.limit) : undefined,
      nodeId: draftFilters.nodeId || undefined,
      service: draftFilters.service || undefined,
      sourceIp: draftFilters.sourceIp || undefined,
    });
  }

  function handleResetFilters() {
    setDraftFilters({
      classification: '',
      days: '',
      limit: '',
      nodeId: '',
      service: '',
      sourceIp: '',
    });
    setFilters({});
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-800 bg-gradient-to-br from-stone-950 via-stone-950 to-cyan-950/20 p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Threat Intel</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-50">Filterable IOC exports and ATT&CK mapping</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Narrow blocklists, IOC previews, ATT&CK counts, and STIX indicators to the same slice of activity before you export or review it.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[28rem]">
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Blocklist IPs</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{blocklistQuery.data?.length ?? 0}</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">IOC rows</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{iocQuery.data?.length ?? 0}</p>
            </div>
            <div className="rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Active filters</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{activeFilterCount}</p>
            </div>
          </div>
        </div>
      </section>
      <form className="grid gap-4 rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5 lg:grid-cols-[1.1fr,1.1fr,1fr]" onSubmit={handleApplyFilters}>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Classification</span>
          <input
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-cyan-400/50"
            onChange={(event) => setDraftFilters((current) => ({ ...current, classification: event.target.value }))}
            placeholder="scanner"
            value={draftFilters.classification}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Service</span>
          <input
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-cyan-400/50"
            onChange={(event) => setDraftFilters((current) => ({ ...current, service: event.target.value }))}
            placeholder="openai"
            value={draftFilters.service}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Node</span>
          <select
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-cyan-400/50"
            onChange={(event) => setDraftFilters((current) => ({ ...current, nodeId: event.target.value }))}
            value={draftFilters.nodeId}
          >
            <option value="">All approved nodes</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Source IP</span>
          <input
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-cyan-400/50"
            onChange={(event) => setDraftFilters((current) => ({ ...current, sourceIp: event.target.value }))}
            placeholder="203.0.113.10"
            value={draftFilters.sourceIp}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Days</span>
          <input
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-cyan-400/50"
            min="1"
            onChange={(event) => setDraftFilters((current) => ({ ...current, days: event.target.value }))}
            placeholder="7"
            type="number"
            value={draftFilters.days}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Limit</span>
          <input
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-cyan-400/50"
            max="500"
            min="1"
            onChange={(event) => setDraftFilters((current) => ({ ...current, limit: event.target.value }))}
            placeholder="100"
            type="number"
            value={draftFilters.limit}
          />
        </label>
        <div className="flex items-end gap-3">
          <button className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-cyan-400" type="submit">
            Apply filters
          </button>
          <button
            className="rounded-2xl border border-stone-700 px-4 py-3 text-sm text-stone-200 transition hover:border-stone-500 hover:bg-stone-900"
            onClick={handleResetFilters}
            type="button"
          >
            Reset
          </button>
        </div>
      </form>
      {queryError ? (
        <p className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {queryError.message}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Blocklist preview</h3>
          <div className="mt-4 space-y-2">
            {(blocklistQuery.data ?? []).map((ip) => (
              <p key={ip} className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-2 text-sm text-stone-200">{ip}</p>
            ))}
            {blocklistQuery.isLoading ? <p className="text-sm text-stone-400">Loading blocklist…</p> : null}
            {!blocklistQuery.isLoading && !blocklistQuery.error && !blocklistQuery.data?.length ? <p className="text-sm text-stone-400">No IPs matched the current filter set.</p> : null}
          </div>
          <p className="mt-4 text-sm text-stone-400">STIX indicators: {stixQuery.data?.objects.length ?? 0}</p>
        </article>
        <div className="space-y-4">
          <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
            <h3 className="text-lg font-semibold text-stone-50">ATT&CK mapping</h3>
            <div className="mt-4 space-y-3">
              {(mitreQuery.data ?? []).map((mapping) => (
                <div key={mapping.techniqueId} className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                  <p className="text-sm font-medium text-stone-50">{mapping.techniqueId} • {mapping.techniqueName}</p>
                  <p className="mt-1 text-sm text-stone-400">{mapping.tactic} • {mapping.count} observations</p>
                </div>
              ))}
              {mitreQuery.isLoading ? <p className="text-sm text-stone-400">Loading MITRE mapping…</p> : null}
              {!mitreQuery.isLoading && !mitreQuery.error && !mitreQuery.data?.length ? <p className="text-sm text-stone-400">No ATT&CK mappings matched the current filter set.</p> : null}
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Recent IOCs</h3>
            <div className="mt-4 space-y-3">
              {(iocQuery.data ?? []).slice(0, 6).map((ioc, index) => (
                <div key={`${ioc.sourceIp}-${index}`} className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3">
                  <p className="text-sm font-medium text-stone-50">{ioc.sourceIp} • {ioc.service}</p>
                  <p className="mt-1 text-sm text-stone-400">{ioc.path ?? 'no path captured'} • {ioc.classification ?? 'unknown'}</p>
                </div>
              ))}
              {iocQuery.isLoading ? <p className="text-sm text-stone-400">Loading IOC feed…</p> : null}
              {!iocQuery.isLoading && !iocQuery.error && !iocQuery.data?.length ? <p className="text-sm text-stone-400">No IOC rows matched the current filter set.</p> : null}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
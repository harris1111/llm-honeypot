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
    setDraftFilters({ classification: '', days: '', limit: '', nodeId: '', service: '', sourceIp: '' });
    setFilters({});
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Threat Intel</h1>

      <form
        className="grid gap-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 lg:grid-cols-[1.1fr,1.1fr,1fr]"
        onSubmit={handleApplyFilters}
      >
        {[
          { key: 'classification', placeholder: 'scanner' },
          { key: 'service', placeholder: 'openai' },
        ].map(({ key, placeholder }) => (
          <label key={key} className="space-y-1.5">
            <span className="text-xs text-[var(--color-text-tertiary)]">{key}</span>
            <input
              className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
              onChange={(event) => setDraftFilters((c) => ({ ...c, [key]: event.target.value }))}
              placeholder={placeholder}
              value={draftFilters[key as keyof typeof draftFilters]}
            />
          </label>
        ))}

        <label className="space-y-1.5">
          <span className="text-xs text-[var(--color-text-tertiary)]">Node</span>
          <select
            className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
            onChange={(event) => setDraftFilters((c) => ({ ...c, nodeId: event.target.value }))}
            value={draftFilters.nodeId}
          >
            <option value="">All nodes</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
        </label>

        {[
          { key: 'sourceIp', placeholder: '203.0.113.10', type: 'text' },
          { key: 'days', placeholder: '7', type: 'number' },
          { key: 'limit', placeholder: '100', type: 'number' },
        ].map(({ key, placeholder, type }) => (
          <label key={key} className="space-y-1.5">
            <span className="text-xs text-[var(--color-text-tertiary)]">{key}</span>
            <input
              className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
              onChange={(event) => setDraftFilters((c) => ({ ...c, [key]: event.target.value }))}
              placeholder={placeholder}
              type={type}
              value={draftFilters[key as keyof typeof draftFilters]}
            />
          </label>
        ))}

        <div className="flex items-end gap-2">
          <button
            className="border border-[var(--color-info-border)] rounded-[var(--radius-md)] bg-[var(--color-info-bg)] px-4 py-2.5 text-xs font-medium text-[var(--color-info)] transition hover:bg-[var(--color-info-bg)]"
            type="submit"
          >
            Apply
          </button>
          <button
            className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)]"
            onClick={handleResetFilters}
            type="button"
          >
            Reset
          </button>
        </div>
      </form>

      {queryError ? (
        <p className="border border-[var(--color-error-border)] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error)]">
          {queryError.message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Blocklist</h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">STIX: {stixQuery.data?.objects.length ?? 0}</span>
          </div>
          <div className="mt-3 space-y-1">
            {(blocklistQuery.data ?? []).map((ip) => (
              <p key={ip} className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
                {ip}
              </p>
            ))}
            {blocklistQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
            {!blocklistQuery.isLoading && !blocklistQuery.error && !blocklistQuery.data?.length ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">No IPs matched.</p>
            ) : null}
          </div>
        </article>

        <div className="space-y-4">
          <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">ATT&amp;CK</h2>
            <div className="mt-3 space-y-2">
              {(mitreQuery.data ?? []).map((mapping) => (
                <div key={mapping.techniqueId} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-3 py-2">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{mapping.techniqueId} · {mapping.techniqueName}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{mapping.tactic} · {mapping.count} observations</p>
                </div>
              ))}
              {mitreQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
              {!mitreQuery.isLoading && !mitreQuery.error && !mitreQuery.data?.length ? (
                <p className="text-xs text-[var(--color-text-tertiary)]">No mappings matched.</p>
              ) : null}
            </div>
          </article>

          <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">IOCs</h2>
            <div className="mt-3 space-y-2">
              {(iocQuery.data ?? []).slice(0, 6).map((ioc, index) => (
                <div key={`${ioc.sourceIp}-${index}`} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-3 py-2">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{ioc.sourceIp} · {ioc.service}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{ioc.path ?? 'no path'} · {ioc.classification ?? 'unknown'}</p>
                </div>
              ))}
              {iocQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
              {!iocQuery.isLoading && !iocQuery.error && !iocQuery.data?.length ? (
                <p className="text-xs text-[var(--color-text-tertiary)]">No IOCs matched.</p>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

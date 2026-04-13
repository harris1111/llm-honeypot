import { useThreatBlocklist, useThreatIocFeed, useThreatMitre, useThreatStix } from '../hooks/use-threat-intel';

export function ThreatIntelRouteView() {
  const blocklistQuery = useThreatBlocklist();
  const iocQuery = useThreatIocFeed();
  const mitreQuery = useThreatMitre();
  const stixQuery = useThreatStix();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Threat Intel</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">IOC exports and ATT&CK mapping</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Blocklist preview</h3>
          <div className="mt-4 space-y-2">
            {(blocklistQuery.data ?? []).map((ip) => (
              <p key={ip} className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-2 text-sm text-stone-200">{ip}</p>
            ))}
            {blocklistQuery.isLoading ? <p className="text-sm text-stone-400">Loading blocklist…</p> : null}
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
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
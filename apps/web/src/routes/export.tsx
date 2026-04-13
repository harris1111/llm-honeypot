import { useExportData, useExportReport } from '../hooks/use-export';

export function ExportRouteView() {
  const reportQuery = useExportReport('markdown', 7);
  const dataQuery = useExportData('json', 7);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Export</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Report and dataset export preview</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.85fr,1.15fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Summary</h3>
          <div className="mt-4 space-y-3 text-sm text-stone-300">
            <p>Report file: {reportQuery.data?.filename ?? 'loading...'}</p>
            <p>Data file: {dataQuery.data?.filename ?? 'loading...'}</p>
            <p>Sessions: {reportQuery.data?.summary.sessions ?? 0}</p>
            <p>Requests: {reportQuery.data?.summary.requests ?? 0}</p>
            <p>Unique source IPs: {reportQuery.data?.summary.uniqueSourceIps ?? 0}</p>
          </div>
        </article>
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <h3 className="text-lg font-semibold text-stone-50">Markdown preview</h3>
          <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-sm text-stone-300">
            {reportQuery.data?.content ?? 'Loading report preview…'}
          </pre>
        </article>
      </div>
    </div>
  );
}
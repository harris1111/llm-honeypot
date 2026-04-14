import { useEffect, useState } from 'react';

import { useArchive, useExportArchives, useExportData, useExportReport } from '../hooks/use-export';

function formatArchiveRange(periodStart: string, periodEnd: string) {
  return `${new Date(periodStart).toLocaleString()} - ${new Date(periodEnd).toLocaleString()}`;
}

function formatArchiveSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportRouteView() {
  const archivesQuery = useExportArchives();
  const reportQuery = useExportReport('markdown', 7);
  const dataQuery = useExportData('json', 7);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedArchiveId && archivesQuery.data?.[0]?.id) {
      setSelectedArchiveId(archivesQuery.data[0].id);
    }
  }, [archivesQuery.data, selectedArchiveId]);

  const archiveQuery = useArchive(selectedArchiveId, 200);

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
      <div className="grid gap-4 lg:grid-cols-[0.85fr,1.15fr]">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-stone-50">Cold storage archives</h3>
              <p className="mt-1 text-sm text-stone-400">Recent gzipped NDJSON bundles uploaded by the worker.</p>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
              {archivesQuery.data?.length ?? 0} bundles
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {archivesQuery.data?.length ? (
              archivesQuery.data.map((archive) => {
                const isSelected = archive.id === selectedArchiveId;

                return (
                  <button
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10 text-stone-50'
                        : 'border-stone-800 bg-stone-900/70 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                    key={archive.id}
                    onClick={() => setSelectedArchiveId(archive.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{archive.storageKey.split('/').at(-1) ?? archive.id}</p>
                        <p className="mt-1 text-xs text-stone-400">{formatArchiveRange(archive.periodStart, archive.periodEnd)}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{formatArchiveSize(archive.archiveSizeBytes)}</p>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-stone-400 sm:grid-cols-3">
                      <p>Sessions: {archive.sessionCount}</p>
                      <p>Requests: {archive.requestCount}</p>
                      <p>Created: {new Date(archive.createdAt).toLocaleString()}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-800 bg-stone-900/50 p-4 text-sm text-stone-400">
                {archivesQuery.isLoading ? 'Loading archives…' : 'No cold storage archives available yet.'}
              </div>
            )}
          </div>
        </article>
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-stone-50">Archive preview</h3>
              <p className="mt-1 text-sm text-stone-400">Selected archive previews are capped to the first 200 NDJSON lines to keep the dashboard responsive.</p>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
              {archiveQuery.data?.previewLineCount
                ? archiveQuery.data.truncated
                  ? `first ${archiveQuery.data.previewLineCount} lines`
                  : `${archiveQuery.data.previewLineCount} lines`
                : archiveQuery.data?.format ?? 'jsonl.gz'}
            </p>
          </div>
          <div className="mt-4 space-y-3 text-sm text-stone-300">
            <p>Archive file: {archiveQuery.data?.filename ?? 'Select an archive'}</p>
            <p>Storage key: {archiveQuery.data?.manifest.storageKey ?? 'Pending selection'}</p>
            <p>Bucket: {archiveQuery.data?.manifest.bucket ?? 'Pending selection'}</p>
            {archiveQuery.data?.previewLineCount ? (
              <p>
                Preview window: first {archiveQuery.data.previewLineCount} lines
                {archiveQuery.data.truncated ? ' (truncated)' : ''}
              </p>
            ) : null}
          </div>
          <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-sm text-stone-300">
            {archiveQuery.data?.content ??
              (selectedArchiveId
                ? archiveQuery.isLoading
                  ? 'Loading archive preview…'
                  : 'Archive preview unavailable.'
                : 'Select an archive to inspect the first 200 lines of its NDJSON payload.')}
          </pre>
        </article>
      </div>
    </div>
  );
}
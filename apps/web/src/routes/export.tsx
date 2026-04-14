import { useEffect, useState } from 'react';

import { useArchive, useExportArchives, useExportData, useExportReport } from '../hooks/use-export';

function formatArchiveRange(periodStart: string, periodEnd: string) {
  return `${new Date(periodStart).toLocaleString()} – ${new Date(periodEnd).toLocaleString()}`;
}

function formatArchiveSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
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
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Export</h1>

      <div className="grid gap-4 lg:grid-cols-[0.85fr,1.15fr]">
        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Summary</h2>
          <div className="mt-3 space-y-2 text-xs text-[var(--color-text-secondary)]">
            <p>report: {reportQuery.data?.filename ?? '...'}</p>
            <p>data: {dataQuery.data?.filename ?? '...'}</p>
            <p>sessions: {reportQuery.data?.summary.sessions ?? 0}</p>
            <p>requests: {reportQuery.data?.summary.requests ?? 0}</p>
            <p>unique IPs: {reportQuery.data?.summary.uniqueSourceIps ?? 0}</p>
          </div>
        </article>

        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Preview</h2>
          <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3 text-xs text-[var(--color-accent)]">
            {reportQuery.data?.content ?? '...'}
          </pre>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr,1.15fr]">
        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Cold storage</h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">{archivesQuery.data?.length ?? 0} bundles</span>
          </div>
          <div className="mt-3 space-y-2">
            {archivesQuery.data?.length ? (
              archivesQuery.data.map((archive) => {
                const isSelected = archive.id === selectedArchiveId;
                return (
                  <button
                    className={`w-full border rounded-[var(--radius-lg)] px-3 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-text-primary)]'
                        : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                    }`}
                    key={archive.id}
                    onClick={() => setSelectedArchiveId(archive.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold">{archive.storageKey.split('/').at(-1) ?? archive.id}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{formatArchiveSize(archive.archiveSizeBytes)}</p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{formatArchiveRange(archive.periodStart, archive.periodEnd)}</p>
                    <div className="mt-2 grid gap-2 text-xs text-[var(--color-text-tertiary)] sm:grid-cols-3">
                      <p>sessions: {archive.sessionCount}</p>
                      <p>requests: {archive.requestCount}</p>
                      <p>{new Date(archive.createdAt).toLocaleDateString()}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {archivesQuery.isLoading ? '...' : 'No archives.'}
              </p>
            )}
          </div>
        </article>

        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Archive</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {archiveQuery.data?.previewLineCount
                ? archiveQuery.data.truncated
                  ? `first ${archiveQuery.data.previewLineCount} lines`
                  : `${archiveQuery.data.previewLineCount} lines`
                : archiveQuery.data?.format ?? 'jsonl.gz'}
            </p>
          </div>
          <div className="mt-3 space-y-1 text-xs text-[var(--color-text-secondary)]">
            <p>file: {archiveQuery.data?.filename ?? 'select an archive'}</p>
            <p>key: {archiveQuery.data?.manifest.storageKey ?? 'pending'}</p>
            <p>bucket: {archiveQuery.data?.manifest.bucket ?? 'pending'}</p>
          </div>
          <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3 text-xs text-[var(--color-accent)]">
            {archiveQuery.data?.content ??
              (selectedArchiveId
                ? archiveQuery.isLoading
                  ? '...'
                  : 'preview unavailable.'
                : 'select an archive to inspect.')}
          </pre>
        </article>
      </div>
    </div>
  );
}

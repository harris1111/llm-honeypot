import type { FormEvent } from 'react';
import { useState } from 'react';

import { useNodes } from '../hooks/use-nodes';
import { useApproveTemplate, useManualBackfeed, useRejectTemplate, useTemplates } from '../hooks/use-templates';

export function ResponseEngineRouteView() {
  const nodesQuery = useNodes();
  const reviewQueueQuery = useTemplates(true);
  const manualBackfeed = useManualBackfeed();
  const approveTemplate = useApproveTemplate();
  const rejectTemplate = useRejectTemplate();
  const [category, setCategory] = useState('manual-backfeed');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const nodes = nodesQuery.data ?? [];
  const pendingTemplates = reviewQueueQuery.data ?? [];
  const selectedNode = nodes.find((node) => node.id === nodeId);
  const actionError = approveTemplate.error?.message ?? rejectTemplate.error?.message;

  async function handleManualBackfeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    try {
      const created = await manualBackfeed.mutateAsync({
        category,
        nodeId,
        prompt,
        subcategory: subcategory || undefined,
      });
      setFeedback(`Queued template ${created.id} for review.`);
      setPrompt('');
      setSubcategory('');
    } catch {
      // mutation error state surfaces the failure
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Response Engine</h1>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <form
          className="space-y-4 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4"
          onSubmit={(event) => void handleManualBackfeed(event)}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Backfeed</h2>
            <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
              {nodes.length} nodes
            </span>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--color-text-tertiary)]">Node</span>
            <select
              className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
              disabled={nodesQuery.isLoading || nodes.length === 0}
              onChange={(event) => setNodeId(event.target.value)}
              required
              value={nodeId}
            >
              <option value="">Select...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} | {node.status}
                </option>
              ))}
            </select>
          </label>

          {nodesQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
          {nodesQuery.error ? (
            <p className="border border-[var(--color-error-border)] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error)]">
              {nodesQuery.error.message}
            </p>
          ) : null}
          {!nodesQuery.isLoading && !nodesQuery.error && nodes.length === 0 ? (
            <p className="text-xs text-[var(--color-text-tertiary)]">No nodes. Approve one first.</p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs text-[var(--color-text-tertiary)]">Category</span>
              <input
                className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
                onChange={(event) => setCategory(event.target.value)}
                placeholder="manual-backfeed"
                value={category}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-[var(--color-text-tertiary)]">Subcategory</span>
              <input
                className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
                onChange={(event) => setSubcategory(event.target.value)}
                placeholder="optional"
                value={subcategory}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--color-text-tertiary)]">Prompt</span>
            <textarea
              className="min-h-36 w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Paste an uncovered prompt..."
              required
              value={prompt}
            />
          </label>

          {selectedNode ? (
            <div className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] px-3 py-2 text-xs text-[var(--color-accent)]">
              Routing via <span className="font-bold text-[var(--color-text-primary)]">{selectedNode.name}</span> [{selectedNode.status}]
            </div>
          ) : null}

          <button
            className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
            disabled={manualBackfeed.isPending || nodesQuery.isLoading || nodes.length === 0}
            type="submit"
          >
            {manualBackfeed.isPending ? 'Generating...' : 'Generate'}
          </button>

          {feedback ? (
            <p className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] px-3 py-2 text-xs text-[var(--color-accent)]">
              {feedback}
            </p>
          ) : null}
          {manualBackfeed.error ? (
            <p className="border border-[var(--color-error-border)] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error)]">
              {manualBackfeed.error.message}
            </p>
          ) : null}
        </form>

        <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Review queue</h2>
            <div className="flex items-center gap-2">
              <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                {pendingTemplates.length} pending
              </span>
              {reviewQueueQuery.isLoading ? (
                <span className="text-xs text-[var(--color-text-tertiary)]">...</span>
              ) : null}
            </div>
          </div>

          {reviewQueueQuery.error ? (
            <p className="mt-3 border border-[var(--color-error-border)] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error)]">
              {reviewQueueQuery.error.message}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            {reviewQueueQuery.isLoading
              ? Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
                    <div className="h-3 w-40 bg-[var(--color-bg-raised)]" />
                    <div className="mt-2 h-2.5 w-56 bg-[var(--color-bg-raised)]" />
                  </div>
                ))
              : pendingTemplates.map((template) => {
                  const isApproving = approveTemplate.isPending && approveTemplate.variables === template.id;
                  const isRejecting = rejectTemplate.isPending && rejectTemplate.variables === template.id;

                  return (
                    <div key={template.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{template.category}</p>
                            <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                              {template.modelName ?? 'proxy-model'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{new Date(template.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--color-accent)] transition hover:bg-[var(--color-accent-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
                            disabled={approveTemplate.isPending || rejectTemplate.isPending}
                            onClick={() => approveTemplate.mutate(template.id)}
                            type="button"
                          >
                            {isApproving ? '...' : 'Approve'}
                          </button>
                          <button
                            className="border border-[var(--color-error-border)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--color-error)] transition hover:bg-[var(--color-error-bg)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
                            disabled={approveTemplate.isPending || rejectTemplate.isPending}
                            onClick={() => rejectTemplate.mutate(template.id)}
                            type="button"
                          >
                            {isRejecting ? '...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-2.5">
                          <p className="text-xs text-[var(--color-text-tertiary)]">Prompt</p>
                          <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-secondary)]">{template.promptText}</p>
                        </div>
                        <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-2.5">
                          <p className="text-xs text-[var(--color-text-tertiary)]">Candidate</p>
                          <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-secondary)]">{template.responseText}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.keywords.length > 0 ? (
                          template.keywords.map((keyword, index) => (
                            <span key={`${template.id}-${keyword}-${index}`} className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="border border-dashed border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs text-[var(--color-text-tertiary)]">
                            no keywords
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

            {!reviewQueueQuery.isLoading && pendingTemplates.length === 0 && !reviewQueueQuery.error ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">No pending templates.</p>
            ) : null}
          </div>

          {actionError ? (
            <p className="mt-3 border border-[var(--color-error-border)] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error)]">
              {actionError}
            </p>
          ) : null}
        </article>
      </div>
    </div>
  );
}

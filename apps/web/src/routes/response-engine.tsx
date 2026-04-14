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
      // Inline mutation state already exposes the failure copy.
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-800 bg-gradient-to-br from-stone-950 via-stone-950 to-emerald-950/20 p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Response Engine</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-50">Manual backfeed and review queue</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Generate candidate templates through the configured real-model proxy, then approve or reject them before they join the response pool.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Available nodes</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{nodes.length}</p>
              <p className="mt-2 text-sm text-stone-400">Choose a registered node to proxy a fresh candidate into review.</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">Queue pressure</p>
              <p className="mt-3 text-3xl font-semibold text-stone-50">{pendingTemplates.length}</p>
              <p className="mt-2 text-sm text-emerald-100/80">
                {selectedNode ? `${selectedNode.name} is selected for the next backfeed.` : 'Review candidates stay isolated until an operator approves them.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <form className="space-y-5 rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5" onSubmit={(event) => void handleManualBackfeed(event)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-stone-50">Manual backfeed</h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">Choose a node with proxy routing configured, then submit an uncovered prompt to generate a review candidate.</p>
            </div>
            <span className="rounded-full border border-stone-700 bg-stone-900/80 px-3 py-1 text-xs text-stone-300">{nodes.length} nodes</span>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-stone-800 bg-stone-900/50 p-4 text-sm text-stone-300 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Step 1</p>
              <p className="mt-2">Select the node that should proxy the request.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Step 2</p>
              <p className="mt-2">Describe the gap with a category, optional subcategory, and prompt.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Step 3</p>
              <p className="mt-2">Review the generated candidate before it ever reaches routing.</p>
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Proxy node</span>
            <select
              className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-emerald-400/50"
              disabled={nodesQuery.isLoading || nodes.length === 0}
              onChange={(event) => setNodeId(event.target.value)}
              required
              value={nodeId}
            >
              <option value="">Select a node…</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} · {node.status}
                </option>
              ))}
            </select>
          </label>
          {nodesQuery.isLoading ? <p className="text-sm text-stone-400">Loading node inventory…</p> : null}
          {nodesQuery.error ? <p className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{nodesQuery.error.message}</p> : null}
          {!nodesQuery.isLoading && !nodesQuery.error && nodes.length === 0 ? (
            <p className="rounded-[1.25rem] border border-dashed border-stone-700 bg-stone-900/40 px-4 py-3 text-sm text-stone-400">
              No nodes are available yet. Approve a node before generating a candidate.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Category</span>
              <input
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-emerald-400/50"
                onChange={(event) => setCategory(event.target.value)}
                placeholder="manual-backfeed"
                value={category}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Subcategory</span>
              <input
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-emerald-400/50"
                onChange={(event) => setSubcategory(event.target.value)}
                placeholder="Optional routing hint"
                value={subcategory}
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-stone-500">Prompt</span>
            <textarea
              className="min-h-40 w-full rounded-[1.5rem] border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-emerald-400/50"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Paste an uncovered prompt to generate a candidate response..."
              required
              value={prompt}
            />
          </label>
          {selectedNode ? (
            <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Routing next generation through <span className="font-medium text-stone-50">{selectedNode.name}</span> while it remains <span className="font-medium uppercase tracking-[0.2em]">{selectedNode.status}</span>.
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
              disabled={manualBackfeed.isPending || nodesQuery.isLoading || nodes.length === 0}
              type="submit"
            >
              {manualBackfeed.isPending ? 'Generating…' : 'Generate candidate'}
            </button>
            <p className="text-xs leading-5 text-stone-400">Candidates are staged for human review first. Nothing is published automatically.</p>
          </div>
          {feedback ? <p className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{feedback}</p> : null}
          {manualBackfeed.error ? <p className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{manualBackfeed.error.message}</p> : null}
        </form>

        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-stone-50">Review queue</h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">Approve candidates to join the template pool, or burn them to keep them out of future routing.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">{pendingTemplates.length} pending</span>
              {reviewQueueQuery.isLoading ? <span className="rounded-full border border-stone-800 bg-stone-900/70 px-3 py-1 text-xs text-stone-400">Syncing…</span> : null}
            </div>
          </div>
          {reviewQueueQuery.error ? <p className="mt-4 rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{reviewQueueQuery.error.message}</p> : null}
          <div className="mt-4 space-y-3">
            {reviewQueueQuery.isLoading
              ? Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-4">
                    <div className="h-4 w-40 rounded-full bg-stone-800" />
                    <div className="mt-3 h-3 w-56 rounded-full bg-stone-800/80" />
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="h-28 rounded-2xl bg-stone-950/80" />
                      <div className="h-28 rounded-2xl bg-stone-950/80" />
                    </div>
                  </div>
                ))
              : pendingTemplates.map((template) => {
                  const isApproving = approveTemplate.isPending && approveTemplate.variables === template.id;
                  const isRejecting = rejectTemplate.isPending && rejectTemplate.variables === template.id;

                  return (
                    <div key={template.id} className="rounded-[1.5rem] border border-stone-800 bg-stone-900/70 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-stone-50">{template.category}</p>
                            <span className="rounded-full border border-stone-700 bg-stone-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-300">{template.modelName ?? 'proxy-model'}</span>
                          </div>
                          <p className="mt-2 text-xs text-stone-400">Queued {new Date(template.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="rounded-2xl border border-emerald-500/40 px-3 py-2 text-xs text-emerald-100 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:border-stone-700 disabled:text-stone-500"
                            disabled={approveTemplate.isPending || rejectTemplate.isPending}
                            onClick={() => approveTemplate.mutate(template.id)}
                            type="button"
                          >
                            {isApproving ? 'Approving…' : 'Approve'}
                          </button>
                          <button
                            className="rounded-2xl border border-rose-500/40 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:border-stone-700 disabled:text-stone-500"
                            disabled={approveTemplate.isPending || rejectTemplate.isPending}
                            onClick={() => rejectTemplate.mutate(template.id)}
                            type="button"
                          >
                            {isRejecting ? 'Rejecting…' : 'Reject'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3">
                          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Prompt</p>
                          <p className="mt-2 text-sm leading-6 text-stone-200">{template.promptText}</p>
                        </div>
                        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3">
                          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Candidate response</p>
                          <p className="mt-2 text-sm leading-6 text-stone-200">{template.responseText}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {template.keywords.length > 0 ? (
                          template.keywords.map((keyword, index) => (
                            <span key={`${template.id}-${keyword}-${index}`} className="rounded-full border border-stone-700 bg-stone-950/80 px-3 py-1 text-xs text-stone-300">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-dashed border-stone-700 px-3 py-1 text-xs text-stone-500">No keywords extracted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            {!reviewQueueQuery.isLoading && pendingTemplates.length === 0 && !reviewQueueQuery.error ? (
              <div className="rounded-[1.5rem] border border-dashed border-stone-800 bg-stone-950/40 px-4 py-8 text-center text-sm text-stone-400">
                <p className="font-medium text-stone-300">No pending templates</p>
                <p className="mt-2">Generate one from the manual backfeed form, then return here to approve or reject it.</p>
              </div>
            ) : null}
          </div>
          {actionError ? <p className="mt-4 rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{actionError}</p> : null}
        </article>
      </div>
    </div>
  );
}
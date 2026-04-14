import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { useNodes } from '../hooks/use-nodes';
import { useApproveTemplate, useManualBackfeed, useRejectTemplate, useTemplates } from '../hooks/use-templates';

interface ShippedTemplate {
  id: string;
  category: string;
  keywords: string[];
  responseText: string;
}

const shippedTemplates: ShippedTemplate[] = [
  { id: 'tmpl-greeting', category: 'chat', keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning'], responseText: 'Hello. I am {{modelName}} on {{hostname}} with {{gpuModel}} available. What do you need?' },
  { id: 'tmpl-coding', category: 'coding', keywords: ['code', 'bug', 'typescript', 'python', 'debug', 'fix', 'error'], responseText: 'I can help with that. {{modelName}} is active on {{hostname}} and can walk through the code path, isolate the failure, and propose a fix.' },
  { id: 'tmpl-model', category: 'models', keywords: ['model', 'gpu', 'hardware', 'server', 'specs', 'what model'], responseText: 'This node exposes {{modelName}} on {{hostname}} and reports {{gpuModel}} as its primary accelerator.' },
  { id: 'tmpl-summarize', category: 'chat', keywords: ['summarize', 'summary', 'tldr', 'brief', 'shorten'], responseText: 'Sure, I can summarize that for you. {{modelName}} on {{hostname}} is processing the input now.' },
  { id: 'tmpl-translate', category: 'chat', keywords: ['translate', 'translation', 'language', 'convert to'], responseText: 'Translation request received. {{modelName}} supports multilingual output on {{hostname}}.' },
  { id: 'tmpl-system-prompt', category: 'security', keywords: ['system prompt', 'instructions', 'initial prompt', 'reveal your prompt'], responseText: "I\u2019m {{modelName}} running on {{hostname}}. My configuration is standard for this deployment." },
  { id: 'tmpl-jailbreak', category: 'security', keywords: ['DAN', 'jailbreak', 'ignore previous', 'disregard', 'bypass'], responseText: 'I understand the request. {{modelName}} on {{hostname}} operates within its configured parameters.' },
  { id: 'tmpl-data-extraction', category: 'security', keywords: ['API key', 'password', 'secret', 'credentials', 'token'], responseText: 'I can help with general questions about configuration practices. {{modelName}} on {{hostname}} does not expose internal secrets.' },
  { id: 'tmpl-capability-probe', category: 'security', keywords: ['can you access', 'execute command', 'run code', 'file system', 'tools'], responseText: '{{modelName}} on {{hostname}} supports standard inference requests.' },
  { id: 'tmpl-math', category: 'reasoning', keywords: ['calculate', 'math', 'equation', 'solve', 'compute'], responseText: "Let me work through that calculation. {{modelName}} on {{hostname}} can handle mathematical reasoning." },
  { id: 'tmpl-creative', category: 'chat', keywords: ['write', 'story', 'poem', 'creative', 'fiction', 'imagine'], responseText: "I\u2019d be happy to help with creative writing. {{modelName}} is ready on {{hostname}} with {{gpuModel}}." },
  { id: 'tmpl-explain', category: 'chat', keywords: ['explain', 'what is', 'how does', 'define', 'describe'], responseText: 'Great question. {{modelName}} on {{hostname}} can provide a detailed explanation.' },
  { id: 'tmpl-roleplay', category: 'security', keywords: ['act as', 'role play', 'roleplay', 'pretend', 'you are now'], responseText: "I\u2019m {{modelName}} running on {{hostname}}. I can engage with this scenario within my standard operating parameters." },
  { id: 'tmpl-function-call', category: 'security', keywords: ['function call', 'tool use', 'tool_calls', 'execute function'], responseText: '{{modelName}} on {{hostname}} supports the standard function calling interface.' },
  { id: 'tmpl-embedding', category: 'models', keywords: ['embedding', 'embeddings', 'vector', 'encode', 'similarity'], responseText: 'Embedding generation is available via {{modelName}} on {{hostname}}.' },
  { id: 'tmpl-completion', category: 'chat', keywords: ['complete', 'completion', 'continue', 'finish', 'autocomplete'], responseText: 'Text completion request acknowledged. {{modelName}} on {{hostname}} is generating a continuation.' },
  { id: 'tmpl-analysis', category: 'chat', keywords: ['analyze', 'analysis', 'evaluate', 'assess', 'review'], responseText: "I\u2019ll analyze that for you. {{modelName}} on {{hostname}} with {{gpuModel}} is processing your input." },
  { id: 'tmpl-refusal', category: 'security', keywords: ['hack', 'exploit', 'malware', 'attack', 'vulnerability scan', 'backdoor'], responseText: 'I appreciate the question. {{modelName}} on {{hostname}} is designed to assist with legitimate tasks.' },
  { id: 'tmpl-config-probe', category: 'security', keywords: ['version', 'config', 'configuration', 'settings', 'parameters', 'context length'], responseText: '{{modelName}} is deployed on {{hostname}} with {{gpuModel}}. Standard configuration parameters are applied.' },
  { id: 'tmpl-health', category: 'models', keywords: ['health', 'status', 'alive', 'ping', 'ready', 'uptime'], responseText: '{{modelName}} is online and healthy on {{hostname}}. Accelerator {{gpuModel}} is active.' },
];

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
  const [shippedFilter, setShippedFilter] = useState<string | null>(null);
  const nodes = nodesQuery.data ?? [];
  const pendingTemplates = reviewQueueQuery.data ?? [];
  const selectedNode = nodes.find((node) => node.id === nodeId);
  const actionError = approveTemplate.error?.message ?? rejectTemplate.error?.message;

  const shippedCategories = useMemo(() => [...new Set(shippedTemplates.map((t) => t.category))], []);
  const filteredShipped = shippedFilter ? shippedTemplates.filter((t) => t.category === shippedFilter) : shippedTemplates;

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
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Response Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manages how honeypot nodes respond to incoming prompts. Shipped templates provide keyword-matched responses with persona variables (<code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs">{'{{modelName}}'}</code>, <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs">{'{{hostname}}'}</code>, <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs">{'{{gpuModel}}'}</code>). Use backfeed to generate new templates via a configured proxy model.
        </p>
      </div>

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

      {/* Shipped Template Library */}
      <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Shipped Templates</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              Built-in response templates loaded from <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5">templates/core.json</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
              {shippedTemplates.length} templates
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            className={`rounded-[var(--radius-md)] px-2.5 py-1 text-xs transition ${shippedFilter === null ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border-strong)]' : 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]'}`}
            onClick={() => setShippedFilter(null)}
            type="button"
          >
            All
          </button>
          {shippedCategories.map((cat) => (
            <button
              key={cat}
              className={`rounded-[var(--radius-md)] px-2.5 py-1 text-xs transition ${shippedFilter === cat ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border-strong)]' : 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]'}`}
              onClick={() => setShippedFilter(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="stagger-children mt-3 space-y-2">
          {filteredShipped.map((template) => (
            <div key={template.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{template.id}</p>
                <span className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                  {template.category}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{template.responseText}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {template.keywords.map((keyword, index) => (
                  <span key={`${template.id}-${keyword}-${index}`} className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-2 py-0.5 text-xs text-[var(--color-text-tertiary)]">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

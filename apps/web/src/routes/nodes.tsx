import type { FormEvent } from 'react';
import { useState } from 'react';

import { NodeCard } from '../components/nodes/node-card';
import { useCreateNode, useNodes } from '../hooks/use-nodes';

export function NodesRouteView() {
  const nodesQuery = useNodes();
  const createNode = useCreateNode();
  const [hostname, setHostname] = useState('');
  const [latestKey, setLatestKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [publicIp, setPublicIp] = useState('');

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await createNode.mutateAsync({
      config: {},
      hostname: hostname || undefined,
      name,
      publicIp: publicIp || undefined,
    });
    setLatestKey(created.nodeKey);
    setHostname('');
    setName('');
    setPublicIp('');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Nodes</h1>

      <form
        className="grid gap-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
        onSubmit={(event) => void handleCreate(event)}
      >
        <input
          className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          required
          value={name}
        />
        <input
          className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
          onChange={(event) => setHostname(event.target.value)}
          placeholder="Hostname"
          value={hostname}
        />
        <input
          className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
          onChange={(event) => setPublicIp(event.target.value)}
          placeholder="IP"
          value={publicIp}
        />
        <button
          className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
          disabled={createNode.isPending}
          type="submit"
        >
          {createNode.isPending ? 'Creating...' : 'Create'}
        </button>
      </form>

      {latestKey ? (
        <div className="border border-[var(--color-border-strong)] rounded-[var(--radius-lg)] bg-[var(--color-accent-muted)] px-4 py-3 text-xs text-[var(--color-accent)]">
          <span className="text-[var(--color-accent)]">[KEY]</span> Issued once — save now: <span className="font-bold">{latestKey}</span>
        </div>
      ) : null}

      <div className="stagger-children grid gap-4 xl:grid-cols-2">
        {(nodesQuery.data ?? []).map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
        {!nodesQuery.isLoading && !nodesQuery.data?.length ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No nodes yet.</p>
        ) : null}
      </div>
    </div>
  );
}

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Nodes</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-50">Provision and approve honeypot nodes</h2>
        </div>
      </div>

      <form className="grid gap-4 rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto]" onSubmit={(event) => void handleCreate(event)}>
        <input className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setName(event.target.value)} placeholder="Node name" required value={name} />
        <input className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setHostname(event.target.value)} placeholder="Hostname" value={hostname} />
        <input className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setPublicIp(event.target.value)} placeholder="Public IP" value={publicIp} />
        <button className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400" disabled={createNode.isPending} type="submit">
          {createNode.isPending ? 'Creating…' : 'Create node'}
        </button>
      </form>

      {latestKey ? (
        <div className="rounded-[1.75rem] border border-emerald-500/35 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Raw node key issued once: <span className="font-mono">{latestKey}</span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {(nodesQuery.data ?? []).map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
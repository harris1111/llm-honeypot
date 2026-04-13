import type { NodeRecord, UpdateNodeRequest } from '@llmtrap/shared';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface NodeConfigFormProps {
  isSubmitting?: boolean;
  node: NodeRecord;
  onSubmit: (input: UpdateNodeRequest) => Promise<void> | void;
}

export function NodeConfigForm({ isSubmitting, node, onSubmit }: NodeConfigFormProps) {
  const [configText, setConfigText] = useState(JSON.stringify(node.config ?? {}, null, 2));
  const [hostname, setHostname] = useState(node.hostname ?? '');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [name, setName] = useState(node.name);
  const [personaId, setPersonaId] = useState(node.personaId ?? '');
  const [publicIp, setPublicIp] = useState(node.publicIp ?? '');

  useEffect(() => {
    setConfigText(JSON.stringify(node.config ?? {}, null, 2));
    setHostname(node.hostname ?? '');
    setName(node.name);
    setPersonaId(node.personaId ?? '');
    setPublicIp(node.publicIp ?? '');
  }, [node]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const parsedConfig = configText.trim() ? (JSON.parse(configText) as Record<string, unknown>) : {};
      setJsonError(null);
      await onSubmit({
        config: parsedConfig,
        hostname: hostname || undefined,
        name,
        personaId: personaId || null,
        publicIp: publicIp || undefined,
        status: node.status,
      });
    } catch {
      setJsonError('Config must be valid JSON.');
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-stone-300">Node name</span>
          <input className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-stone-300">Hostname</span>
          <input className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setHostname(event.target.value)} value={hostname} />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-stone-300">Public IP</span>
          <input className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setPublicIp(event.target.value)} value={publicIp} />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-stone-300">Persona ID</span>
          <input className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100" onChange={(event) => setPersonaId(event.target.value)} value={personaId} />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-stone-300">Config JSON</span>
        <textarea
          className="min-h-56 w-full rounded-[1.5rem] border border-stone-700 bg-stone-950 px-4 py-3 font-mono text-sm text-stone-100"
          onChange={(event) => setConfigText(event.target.value)}
          value={configText}
        />
      </label>

      {jsonError ? <p className="text-sm text-rose-300">{jsonError}</p> : null}

      <button className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Saving…' : 'Save node configuration'}
      </button>
    </form>
  );
}
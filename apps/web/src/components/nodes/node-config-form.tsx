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
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-[var(--color-text-tertiary)]">Name</span>
          <input
            className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-[var(--color-text-tertiary)]">Hostname</span>
          <input
            className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
            onChange={(event) => setHostname(event.target.value)}
            value={hostname}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-[var(--color-text-tertiary)]">IP</span>
          <input
            className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
            onChange={(event) => setPublicIp(event.target.value)}
            value={publicIp}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-[var(--color-text-tertiary)]">Persona</span>
          <input
            className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
            onChange={(event) => setPersonaId(event.target.value)}
            value={personaId}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-[var(--color-text-tertiary)]">Config</span>
        <textarea
          className="min-h-48 w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-accent)] outline-none transition focus:border-[var(--color-input-border-focus)]"
          onChange={(event) => setConfigText(event.target.value)}
          value={configText}
        />
      </label>

      {jsonError ? <p className="text-xs text-[var(--color-error)]">{jsonError}</p> : null}

      <button
        className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

import { usePersonas } from '../hooks/use-personas';

export function PersonasRouteView() {
  const personasQuery = usePersonas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Personas</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          A persona defines the <strong>identity</strong> a honeypot node presents to attackers.
          Every response uses the persona's model name, GPU, hostname, and timing — so all
          emulated services look like one consistent AI deployment.
        </p>
      </div>

      {/* How it works callout */}
      <div className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3">
        <span className="shrink-0 text-lg">💡</span>
        <div className="text-sm leading-6 text-[var(--color-text-primary)]">
          <strong>How it works:</strong> When an attacker queries <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs font-mono text-[var(--color-accent)]">/api/version</code> on
          Ollama, they see the <em>same model name</em> that appears in a <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs font-mono text-[var(--color-accent)]">/v1/chat/completions</code> response
          on the OpenAI surface. Template variables like <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs font-mono text-[var(--color-accent)]">{'{{modelName}}'}</code>, <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs font-mono text-[var(--color-accent)]">{'{{hostname}}'}</code>,
          and <code className="rounded bg-[var(--color-bg-inset)] px-1 py-0.5 text-xs font-mono text-[var(--color-accent)]">{'{{gpuModel}}'}</code> are substituted from the active persona snapshot.
        </div>
      </div>

      <div className="stagger-children grid gap-4 lg:grid-cols-2">
        {(personasQuery.data ?? []).map((persona) => {
          const enabledServices = Object.keys(persona.services).filter((s) => persona.services[s]);
          const enabledConfigs = Object.keys(persona.configFiles).filter((f) => persona.configFiles[f]);

          return (
            <article key={persona.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block border border-[var(--color-accent)] rounded-[var(--radius-md)] bg-[var(--color-accent-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                    {persona.preset ?? 'custom'}
                  </span>
                  <h2 className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{persona.name}</h2>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2">
                  <p className="text-xs text-[var(--color-text-tertiary)]">Active Services</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-primary)]">{enabledServices.length > 0 ? enabledServices.join(', ') : 'none'}</p>
                </div>
                <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-3 py-2">
                  <p className="text-xs text-[var(--color-text-tertiary)]">Config Files</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-primary)]">{enabledConfigs.length > 0 ? enabledConfigs.join(', ') : 'none'}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {enabledServices.map((svc) => (
                  <span key={svc} className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                    {svc}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
        {personasQuery.isLoading ? (
          <div className="animate-pulse border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-4">
            <div className="h-3 w-24 rounded bg-[var(--color-bg-raised)]" />
            <div className="mt-3 h-4 w-40 rounded bg-[var(--color-bg-raised)]" />
          </div>
        ) : null}
        {!personasQuery.isLoading && !personasQuery.data?.length ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No personas yet. Create one from node settings or import a preset.</p>
        ) : null}
      </div>
    </div>
  );
}

import { usePersonas } from '../hooks/use-personas';

export function PersonasRouteView() {
  const personasQuery = usePersonas();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Personas</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {(personasQuery.data ?? []).map((persona) => (
          <article key={persona.id} className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4 transition hover:border-[var(--color-border-strong)]">
            <p className="text-xs text-[var(--color-text-tertiary)]">{persona.preset ?? 'custom'}</p>
            <h2 className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">{persona.name}</h2>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              services: {Object.keys(persona.services).filter((s) => persona.services[s]).join(', ') || 'none'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              configs: {Object.keys(persona.configFiles).filter((f) => persona.configFiles[f]).join(', ') || 'none'}
            </p>
          </article>
        ))}
        {personasQuery.isLoading ? <p className="text-xs text-[var(--color-text-tertiary)]">...</p> : null}
        {!personasQuery.isLoading && !personasQuery.data?.length ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No personas yet.</p>
        ) : null}
      </div>
    </div>
  );
}

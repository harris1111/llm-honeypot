import { usePersonas } from '../hooks/use-personas';

export function PersonasRouteView() {
  const personasQuery = usePersonas();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Personas</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Persona library</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(personasQuery.data ?? []).map((persona) => (
          <article key={persona.id} className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{persona.preset ?? 'custom'}</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-50">{persona.name}</h3>
            <p className="mt-3 text-sm text-stone-400">Services: {Object.keys(persona.services).filter((service) => persona.services[service]).join(', ') || 'none'}</p>
            <p className="mt-2 text-sm text-stone-400">Config files: {Object.keys(persona.configFiles).filter((file) => persona.configFiles[file]).join(', ') || 'none'}</p>
          </article>
        ))}
        {personasQuery.isLoading ? <p className="text-sm text-stone-400">Loading personas…</p> : null}
      </div>
    </div>
  );
}
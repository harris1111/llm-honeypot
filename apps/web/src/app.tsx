const phases = [
  'Monorepo foundation',
  'Dashboard foundation',
  'Honeypot node core',
  'Threat intelligence pipeline',
];

export function App() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-emerald-500/30 bg-stone-900/80 p-8 shadow-[0_20px_80px_rgba(6,78,59,0.25)]">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">LLMTrap</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-50">
            Multi-protocol AI honeypot dashboard scaffold.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
            Phase 1 establishes the monorepo, shared contracts, Prisma schema, and the first bootable apps so later protocol,
            capture, and intelligence work can iterate against a real baseline.
          </p>
        </div>

        <aside className="rounded-3xl border border-stone-800 bg-stone-900/70 p-8">
          <h2 className="text-lg font-medium text-stone-100">Execution status</h2>
          <ul className="mt-5 space-y-3 text-sm text-stone-300">
            {phases.map((phase, index) => (
              <li key={phase} className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                  {index + 1}
                </span>
                <span>{phase}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
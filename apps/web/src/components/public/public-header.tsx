import { Link } from '@tanstack/react-router';

export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <Link className="inline-flex items-center gap-3 text-stone-100 no-underline" to="/">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-400/10 text-sm font-semibold text-emerald-200">
          LT
        </span>
        <span>
          <span className="block text-xs uppercase tracking-[0.35em] text-emerald-300">LLMTrap</span>
          <span className="block text-sm text-stone-300">Open-source AI honeypot platform</span>
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          activeProps={{ className: 'border-stone-600 bg-white/10 text-stone-50' }}
          className="rounded-full border border-transparent px-4 py-2 text-stone-300 no-underline transition hover:border-stone-700 hover:bg-white/5 hover:text-stone-100"
          to="/docs"
        >
          Repository docs
        </Link>
        <Link
          className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 font-medium text-emerald-100 no-underline transition hover:border-emerald-300/50 hover:bg-emerald-400/15"
          to="/login"
        >
          Operator login
        </Link>
      </nav>
    </header>
  );
}
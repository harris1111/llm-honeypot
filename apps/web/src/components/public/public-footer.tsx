import { Link } from '@tanstack/react-router';

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-stone-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-stone-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-medium text-stone-200">LLMTrap</p>
          <p className="mt-1 max-w-2xl">Multi-protocol AI honeypot surfaces, operator tooling, and repository-owned docs for contributors.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="text-stone-300 no-underline transition hover:text-stone-100" to="/">
            Landing
          </Link>
          <Link className="text-stone-300 no-underline transition hover:text-stone-100" to="/docs">
            Repository docs
          </Link>
          <Link className="text-stone-300 no-underline transition hover:text-stone-100" to="/login">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
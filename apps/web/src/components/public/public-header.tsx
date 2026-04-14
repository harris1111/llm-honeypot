import { Link } from '@tanstack/react-router';

import { ThemeToggle } from '../ui/theme-toggle';

export function PublicHeader() {
  return (
    <header className="border-b border-[var(--color-border-default)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link className="flex items-center gap-2 no-underline" to="/">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-xs font-bold text-[var(--color-text-inverse)]">L</span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">LLMTrap</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link activeProps={{ className: 'text-[var(--color-accent)]' }} className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-text-primary)]" to="/docs">
            Docs
          </Link>
          <Link className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-text-primary)]" to="/login">
            Login
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

import { Link } from '@tanstack/react-router';

import { ThemeToggle } from '../ui/theme-toggle';
import { UserDropdown } from './user-dropdown';

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-5">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          className="rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] no-underline transition hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
          to="/docs"
        >
          Docs
        </Link>
        <div className="h-5 w-px bg-[var(--color-border-default)]" />
        <UserDropdown />
      </div>
    </header>
  );
}

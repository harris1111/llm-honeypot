import { Link } from '@tanstack/react-router';

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border-default)]">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6 text-xs text-[var(--color-text-tertiary)] lg:px-8">
        <span>LLMTrap — open-source AI honeypot</span>
        <div className="flex gap-4">
          <Link className="no-underline transition hover:text-[var(--color-text-secondary)]" to="/docs">Docs</Link>
          <Link className="no-underline transition hover:text-[var(--color-text-secondary)]" to="/login">Login</Link>
        </div>
      </div>
    </footer>
  );
}

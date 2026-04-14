import { Link } from '@tanstack/react-router';

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">LLMTrap</p>
            <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
              Open-source, multi-protocol AI honeypot platform for security research. Capture and analyze malicious activity targeting LLM endpoints.
            </p>
          </div>

          {/* Docs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Documentation</p>
            <ul className="mt-3 space-y-2 text-xs">
              {[
                { label: 'Getting Started', to: '/docs/getting-started' },
                { label: 'Deploy Dashboard', to: '/docs/deploy-dashboard' },
                { label: 'How It Works', to: '/docs/how-it-works' },
                { label: 'Smoke Tests', to: '/docs/smoke-tests' },
              ].map((link) => (
                <li key={link.to}>
                  <Link className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-accent)]" to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Project */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Project</p>
            <ul className="mt-3 space-y-2 text-xs">
              <li><a className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-accent)]" href="https://github.com/harris1111/llm-honeypot" rel="noopener noreferrer" target="_blank">GitHub</a></li>
              <li><a className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-accent)]" href="https://github.com/harris1111/llm-honeypot/issues" rel="noopener noreferrer" target="_blank">Issues</a></li>
              <li><Link className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-accent)]" to="/docs/configure-node">Configure Node</Link></li>
              <li><Link className="text-[var(--color-text-secondary)] no-underline transition hover:text-[var(--color-accent)]" to="/docs/using-dashboard">Using Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border-default)] pt-4 text-xs text-[var(--color-text-tertiary)]">
          <p>© {new Date().getFullYear()} LLMTrap — MIT License</p>
        </div>
      </div>
    </footer>
  );
}

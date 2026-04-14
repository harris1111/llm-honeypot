import { Link } from '@tanstack/react-router';

import { PublicHeader } from '../components/public/public-header';
import { PublicFooter } from '../components/public/public-footer';
import { docsNavigation } from '../content/public-docs';

const docCards = [
  { id: 'getting-started', icon: '📋', description: 'Prerequisites, ports, and credentials.', color: 'var(--color-accent)' },
  { id: 'deploy-dashboard', icon: '🚀', description: 'Boot the dashboard with Docker Compose.', color: 'var(--color-info)' },
  { id: 'enroll-node', icon: '🔗', description: 'Create, approve, and start a node.', color: 'var(--color-warning)' },
  { id: 'smoke-tests', icon: '🧪', description: 'Probe endpoints and run smoke scripts.', color: 'var(--color-success)' },
];

const quickCommands = [
  { label: 'Start dashboard', code: 'docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build' },
  { label: 'Check health', code: 'curl http://localhost:4000/api/v1/health' },
  { label: 'Open UI', code: 'open http://localhost:3000' },
];

export function DocsRouteView() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-6 pb-20 pt-12">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-3 text-lg leading-7 text-[var(--color-text-secondary)]">
          Set up the dashboard, enroll a honeypot node, and start capturing traffic.
        </p>

        {/* Card grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {docCards.map((card) => {
            const navItem = docsNavigation.find((n) => n.id === card.id);
            if (!navItem) return null;
            return (
              <Link
                className="group rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 no-underline transition hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]"
                key={card.id}
                to={navItem.to}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-xl" style={{ backgroundColor: `color-mix(in srgb, ${card.color} 12%, transparent)` }}>
                  {card.icon}
                </div>
                <h2 className="mt-3 font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">{navItem.title}</h2>
                <p className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">{card.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Quick commands */}
        <div className="mt-14">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Quick start</h2>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">Get running in 60 seconds:</p>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]">
            <div className="border-b border-[var(--color-code-border)] bg-[var(--color-code-tab-bg)] px-4 py-2">
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">Terminal</span>
            </div>
            <pre className="overflow-x-auto p-4 text-[13px] leading-7 text-[var(--color-code-text)]"><code>{quickCommands.map((cmd) => (
              <span key={cmd.label}><span style={{ color: 'var(--color-text-tertiary)' }}>{'# '}{cmd.label}</span>{'\n'}<span style={{ color: 'var(--color-accent)' }}>$</span> {cmd.code}{'\n\n'}</span>
            ))}</code></pre>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: 'Compose stacks', value: '2', color: 'var(--color-accent)' },
            { label: 'AI surfaces', value: '9', color: 'var(--color-info)' },
            { label: 'Listeners', value: '7', color: 'var(--color-warning)' },
            { label: 'Phases done', value: '4', color: 'var(--color-success)' },
          ].map((fact) => (
            <div className="text-center" key={fact.label}>
              <p className="text-3xl font-bold" style={{ color: fact.color }}>{fact.value}</p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{fact.label}</p>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

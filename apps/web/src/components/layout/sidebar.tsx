import { Link } from '@tanstack/react-router';

const navigation = [
  { label: 'Overview', to: '/overview' },
  { label: 'Nodes', to: '/nodes' },
  { label: 'Sessions', to: '/sessions' },
  { label: 'Actors', to: '/actors' },
  { label: 'Personas', to: '/personas' },
  { label: 'Response Engine', to: '/response-engine' },
  { label: 'Alerts', to: '/alerts' },
  { label: 'Threat Intel', to: '/threat-intel' },
  { label: 'Live Feed', to: '/live-feed' },
  { label: 'Export', to: '/export' },
  { label: 'Settings', to: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)] lg:w-56">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border-default)] px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-xs font-bold text-[var(--color-text-inverse)]">L</span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">LLMTrap</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigation.map((item) => (
          <Link
            key={item.to}
            activeProps={{ className: 'bg-[var(--color-sidebar-item-active-bg)] text-[var(--color-sidebar-item-active-text)] font-medium' }}
            className="block rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-text-primary)]"
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

import { Link } from '@tanstack/react-router';

const navigation = [
  { description: 'Live node, session, and capture snapshot', label: 'Overview', to: '/overview' },
  { description: 'Approve and configure nodes', label: 'Nodes', to: '/nodes' },
  { description: 'Recent captured interaction timelines', label: 'Sessions', to: '/sessions' },
  { description: 'Correlated operators, scanners, and repeat visitors', label: 'Actors', to: '/actors' },
  { description: 'Persona presets and custom node identities', label: 'Personas', to: '/personas' },
  { description: 'Manual backfeed and pending template review queue', label: 'Response Engine', to: '/response-engine' },
  { description: 'Rule definitions and alert delivery history', label: 'Alerts', to: '/alerts' },
  { description: 'IOC exports, blocklists, and MITRE mapping', label: 'Threat Intel', to: '/threat-intel' },
  { description: 'Recent request stream with optional auto-refresh', label: 'Live Feed', to: '/live-feed' },
  { description: 'Generate markdown, HTML, JSON, and CSV exports', label: 'Export', to: '/export' },
  { description: 'Global controls and env', label: 'Settings', to: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="w-full rounded-[2rem] border border-stone-800 bg-stone-900/85 p-5 lg:w-72">
      <div className="border-b border-stone-800 pb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">LLMTrap</p>
        <h1 className="mt-3 text-xl font-semibold text-stone-50">Dashboard Control Plane</h1>
      </div>
      <nav className="mt-5 space-y-3">
        {navigation.map((item) => (
          <Link
            key={item.to}
            activeProps={{ className: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100' }}
            className="block rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-3 text-stone-300 transition hover:border-stone-700 hover:text-stone-100"
            to={item.to}
          >
            <p className="text-sm font-medium">{item.label}</p>
            <p className="mt-1 text-xs text-stone-400">{item.description}</p>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
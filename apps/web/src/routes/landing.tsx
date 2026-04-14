import { Link } from '@tanstack/react-router';

import { PublicFooter } from '../components/public/public-footer';
import { PublicHeader } from '../components/public/public-header';

const capabilities = [
  { title: 'AI Protocols', description: 'Ollama, OpenAI, Anthropic, vLLM, LM Studio, and more.', icon: '🤖', color: 'var(--color-accent)' },
  { title: 'MCP & IDE Bait', description: 'Trap MCP tool calls and IDE config probes.', icon: '🪤', color: 'var(--color-warning)' },
  { title: 'Classic Services', description: 'SSH, FTP, SMTP, DNS, SMB, Telnet.', icon: '🌐', color: 'var(--color-info)' },
  { title: 'Session Tracking', description: 'Group captures into reviewable timelines.', icon: '📋', color: 'var(--color-success)' },
  { title: 'Response Engine', description: 'Persona-consistent replies with review.', icon: '⚙️', color: 'var(--color-error)' },
  { title: 'Threat Intel', description: 'IOC export, MITRE, STIX, blocklists.', icon: '🔍', color: 'var(--color-accent)' },
];

const tryItCommands = [
  { label: 'Ollama chat', code: 'curl http://localhost:11434/api/chat -d \'{"model":"llama3","messages":[{"role":"user","content":"hello"}]}\'', color: 'var(--color-success)' },
  { label: 'OpenAI models', code: 'curl http://localhost:8080/v1/models', color: 'var(--color-info)' },
  { label: 'Qdrant collections', code: 'curl http://localhost:6333/collections', color: 'var(--color-warning)' },
  { label: 'SSH banner grab', code: 'ssh -p 20022 localhost', color: 'var(--color-error)' },
];

export function LandingRouteView() {
  return (
    <div>
      <PublicHeader />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center lg:pt-24">
        <div className="mx-auto inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span className="text-xs text-[var(--color-text-secondary)]">9 AI surfaces + 7 traditional listeners</span>
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
          Capture hostile<br />
          <span className="text-[var(--color-accent)]">AI traffic</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-[var(--color-text-secondary)]">
          Deploy fake AI endpoints. Capture attacker requests. Analyze everything in a dashboard.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-inverse)] no-underline shadow-[var(--shadow-sm)] transition hover:opacity-90" to="/docs">
            Get started
          </Link>
          <Link className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] no-underline transition hover:border-[var(--color-border-strong)]" to="/login">
            Dashboard
          </Link>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">What it traps</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <div className="group rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 transition hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]" key={item.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-xl" style={{ backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)` }}>
                {item.icon}
              </div>
              <h3 className="mt-3 font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Try it — fun commands */}
      <section className="border-y border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">Try it out</h2>
          <p className="mt-2 text-center text-sm text-[var(--color-text-tertiary)]">Once the node is running, poke the bait endpoints:</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {tryItCommands.map((cmd) => (
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]" key={cmd.label}>
                <div className="flex items-center gap-2 border-b border-[var(--color-code-border)] bg-[var(--color-code-tab-bg)] px-3 py-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cmd.color }} />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">{cmd.label}</span>
                </div>
                <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-[var(--color-code-text)]"><code><span style={{ color: 'var(--color-text-tertiary)' }}>$</span> {cmd.code}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start steps */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">3 steps to deploy</h2>
        <div className="mt-8 space-y-3">
          {[
            { n: '1', title: 'Deploy the dashboard', desc: 'One Docker Compose command.', to: '/docs/deploy-dashboard', color: 'var(--color-info)' },
            { n: '2', title: 'Enroll a node', desc: 'Create, approve, start.', to: '/docs/enroll-node', color: 'var(--color-warning)' },
            { n: '3', title: 'Watch traffic arrive', desc: 'Probe and review in the dashboard.', to: '/docs/smoke-tests', color: 'var(--color-success)' },
          ].map((item) => (
            <Link className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 no-underline transition hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]" key={item.n} to={item.to}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-white" style={{ backgroundColor: item.color }}>{item.n}</span>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="mt-0.5 text-sm text-[var(--color-text-tertiary)]">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

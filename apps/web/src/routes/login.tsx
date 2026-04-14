import { Link } from '@tanstack/react-router';

import { LoginForm } from '../components/auth/login-form';

export function LoginRouteView() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-emerald-500/30 bg-stone-900/85 p-8 shadow-[0_24px_80px_rgba(6,78,59,0.22)]">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">LLMTrap</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link className="rounded-full border border-white/10 px-4 py-2 text-stone-200 no-underline transition hover:border-white/20 hover:bg-white/5" to="/">
              Public landing
            </Link>
            <Link className="rounded-full border border-white/10 px-4 py-2 text-stone-200 no-underline transition hover:border-white/20 hover:bg-white/5" to="/docs">
              Repository docs
            </Link>
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-stone-50">Operate the dashboard control plane.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
            Sign in to review nodes, approve registrations, inspect captured sessions, and tune the shipped response and threat-intel workflows.
          </p>
        </div>
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6">
          <h2 className="text-lg font-medium text-stone-50">Access</h2>
          <p className="mt-2 text-sm text-stone-400">Use the first-admin bootstrap once, then sign in normally.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </aside>
      </section>
    </main>
  );
}
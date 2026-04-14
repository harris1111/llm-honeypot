import { Link } from '@tanstack/react-router';

import { FeaturesSection } from '../components/public/features-section';
import { PublicFooter } from '../components/public/public-footer';
import { PublicHeader } from '../components/public/public-header';
import { architecturePillars, featureCards, landingStats } from '../content/public-site-content';

export function LandingRouteView() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_42%),radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.18),transparent_28%)]" />
      <PublicHeader />
      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-10 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-16 lg:pt-10">
        <div className="rounded-[2.5rem] border border-emerald-400/20 bg-stone-900/75 p-8 shadow-[0_30px_120px_rgba(6,78,59,0.28)] backdrop-blur sm:p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Open-source AI deception stack</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-6xl">
            Run a believable control plane for hostile AI traffic.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            LLMTrap emulates the endpoints attackers expect, captures the traffic they send, and gives operators a dashboard to review nodes, sessions,
            actors, alerts, archives, and response strategies.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-emerald-300/45 bg-emerald-400/15 px-5 py-3 font-medium text-emerald-100 no-underline transition hover:border-emerald-200/70 hover:bg-emerald-400/20"
              to="/login"
            >
              Open operator login
            </Link>
            <Link
              className="rounded-full border border-white/10 px-5 py-3 font-medium text-stone-100 no-underline transition hover:border-white/20 hover:bg-white/5"
              to="/docs"
            >
              Read repository docs
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {landingStats.map((stat) => (
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur" key={stat.label}>
              <p className="text-sm uppercase tracking-[0.3em] text-stone-400">{stat.label}</p>
              <p className="mt-4 text-4xl font-semibold text-stone-50">{stat.value}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {architecturePillars.map((pillar) => (
            <article className="rounded-[2rem] border border-white/10 bg-stone-900/70 p-6" key={pillar.title}>
              <p className="text-xs uppercase tracking-[0.35em] text-orange-300">{pillar.path}</p>
              <h2 className="mt-4 text-2xl font-semibold text-stone-50">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-300">{pillar.description}</p>
              <ul className="mt-5 space-y-3 text-sm text-stone-200">
                {pillar.highlights.map((highlight) => (
                  <li className="flex gap-3" key={highlight}>
                    <span aria-hidden className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <FeaturesSection items={featureCards} />
      <section className="mx-auto max-w-7xl px-6 pb-18 pt-4 lg:px-8">
        <div className="rounded-[2.5rem] border border-orange-300/20 bg-[linear-gradient(135deg,rgba(28,25,23,0.92),rgba(17,24,39,0.88))] p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Contributor path</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
            Start on the public surface, then drop into the dashboard when you need to operate the trap.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full border border-white/10 px-5 py-3 font-medium text-stone-100 no-underline transition hover:border-white/20 hover:bg-white/5" to="/docs">
              Explore apps and packages
            </Link>
            <Link className="rounded-full border border-emerald-300/45 bg-emerald-400/15 px-5 py-3 font-medium text-emerald-100 no-underline transition hover:border-emerald-200/70 hover:bg-emerald-400/20" to="/login">
              Go to operator login
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
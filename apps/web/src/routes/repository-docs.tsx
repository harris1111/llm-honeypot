import { Link } from '@tanstack/react-router';

import { PublicFooter } from '../components/public/public-footer';
import { PublicHeader } from '../components/public/public-header';
import { RepositorySurfaceGrid } from '../components/public/repository-surface-grid';
import { appSurfaces, packageSurfaces, supportingSurfaces } from '../content/public-site-content';

export function RepositoryDocsRouteView() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_34%)]" />
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-6 pb-18 pt-6 lg:px-8 lg:pt-10">
        <section className="rounded-[2.5rem] border border-white/10 bg-stone-900/75 p-8 backdrop-blur sm:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Repository guide</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-6xl">
            Every app, shared package, and support directory in one scan.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            This page is the public explainer for contributors who want the same quick orientation they get from other mature open-source repos: what runs,
            what is shared, and where operational assets live.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full border border-white/10 px-5 py-3 font-medium text-stone-100 no-underline transition hover:border-white/20 hover:bg-white/5" to="/">
              Back to landing
            </Link>
            <Link className="rounded-full border border-emerald-300/45 bg-emerald-400/15 px-5 py-3 font-medium text-emerald-100 no-underline transition hover:border-emerald-200/70 hover:bg-emerald-400/20" to="/login">
              Operator login
            </Link>
          </div>
        </section>
        <RepositorySurfaceGrid
          description="These are the deployable processes in the monorepo. Together they form the dashboard control plane and the honeypot runtime."
          items={appSurfaces}
          kicker="Deployable apps"
          title="Runtime surfaces"
        />
        <RepositorySurfaceGrid
          description="These packages hold the shared contracts and engines that keep behavior aligned across the API, worker, and node stacks."
          items={packageSurfaces}
          kicker="Shared packages"
          title="Reusable building blocks"
        />
        <RepositorySurfaceGrid
          description="Operational files, shipped templates, test assets, project docs, and execution plans live here. These directories explain how the repo is built and validated."
          items={supportingSurfaces}
          kicker="Support directories"
          title="What else lives in the repo"
        />
      </div>
      <PublicFooter />
    </div>
  );
}
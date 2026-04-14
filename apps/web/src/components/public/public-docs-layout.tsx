import { Link } from '@tanstack/react-router';

import { docsNavigation, type DocsPage } from '../../content/public-docs';
import { PublicFooter } from './public-footer';
import { PublicHeader } from './public-header';
import { PublicDocsPageSections } from './public-docs-page-sections';

interface PublicDocsLayoutProps {
  page: DocsPage;
}

export function PublicDocsLayout({ page }: PublicDocsLayoutProps) {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_34%)]" />
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-6 pb-18 pt-6 lg:px-8 lg:pt-8">
        <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="hidden self-start lg:sticky lg:top-6 lg:block">
            <div className="rounded-[2rem] border border-white/10 bg-stone-900/80 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Docs navigation</p>
              <nav aria-label="Docs pages" className="mt-5 flex flex-col gap-2">
                {docsNavigation.map((item) => (
                  <Link
                    activeOptions={{ exact: true }}
                    activeProps={{ className: 'border-emerald-300/40 bg-emerald-400/10 text-stone-50' }}
                    className="rounded-[1.25rem] border border-transparent px-4 py-3 text-stone-300 no-underline transition hover:border-white/10 hover:bg-white/[0.04] hover:text-stone-100"
                    key={item.id}
                    to={item.to}
                  >
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-stone-400">{item.summary}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-xs uppercase tracking-[0.35em] text-orange-300">On this page</p>
                <div className="mt-4 flex flex-col gap-2">
                  {page.sections.map((section) => (
                    <a className="rounded-full px-3 py-2 text-sm text-stone-300 transition hover:bg-white/[0.04] hover:text-stone-100" href={`#${section.id}`} key={section.id}>
                      {section.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <div className="min-w-0">
            <section className="rounded-[2.5rem] border border-white/10 bg-stone-900/75 p-8 backdrop-blur sm:p-10">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">{page.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-6xl">{page.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">{page.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
                {docsNavigation.map((item) => (
                  <Link
                    activeOptions={{ exact: true }}
                    activeProps={{ className: 'border-emerald-300/40 bg-emerald-400/10 text-stone-50' }}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-200 no-underline transition hover:border-white/20 hover:bg-white/5"
                    key={item.id}
                    to={item.to}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                {page.sections.map((section) => (
                  <a className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-200 transition hover:border-white/20 hover:bg-white/5" href={`#${section.id}`} key={section.id}>
                    {section.title}
                  </a>
                ))}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {page.quickFacts.map((fact) => (
                  <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5" key={fact.label}>
                    <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{fact.label}</p>
                    <p className="mt-3 text-xl font-semibold text-stone-50">{fact.value}</p>
                  </article>
                ))}
              </div>
            </section>
            <PublicDocsPageSections page={page} />
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
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
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_160px]">

          {/* Left sidebar — title-only nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-6 space-y-1">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Docs</p>
              {docsNavigation.map((item) => (
                <Link
                  activeOptions={{ exact: true }}
                  activeProps={{ className: 'bg-[var(--color-sidebar-item-active-bg)] text-[var(--color-sidebar-item-active-text)] font-medium' }}
                  className="block rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] no-underline transition hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-text-primary)]"
                  key={item.id}
                  to={item.to}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="min-w-0 max-w-[var(--content-max-width)]">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)]">
              <Link className="no-underline transition hover:text-[var(--color-text-primary)]" to="/">Home</Link>
              <span>/</span>
              <Link className="no-underline transition hover:text-[var(--color-text-primary)]" to="/docs">Docs</Link>
              {page.id !== 'overview' ? (
                <>
                  <span>/</span>
                  <span className="text-[var(--color-text-primary)]">{page.title}</span>
                </>
              ) : null}
            </nav>

            {/* Page header — minimal */}
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{page.title}</h1>
            <p className="mt-4 text-lg leading-8 text-[var(--color-text-secondary)]">{page.summary}</p>

            {/* Mobile nav */}
            <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
              {docsNavigation.map((item) => (
                <Link
                  activeOptions={{ exact: true }}
                  activeProps={{ className: 'border-[var(--color-accent)] text-[var(--color-accent)]' }}
                  className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] px-3 py-1 text-xs text-[var(--color-text-secondary)] no-underline"
                  key={item.id}
                  to={item.to}
                >
                  {item.title}
                </Link>
              ))}
            </div>

            {/* Sections */}
            <PublicDocsPageSections page={page} />
          </div>

          {/* Right sidebar — TOC */}
          <aside className="hidden xl:block">
            <div className="sticky top-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">On this page</p>
              <nav className="space-y-1">
                {page.sections.map((section) => (
                  <a
                    className="block py-1 text-sm text-[var(--color-text-tertiary)] no-underline transition hover:text-[var(--color-text-primary)]"
                    href={`#${section.id}`}
                    key={section.id}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

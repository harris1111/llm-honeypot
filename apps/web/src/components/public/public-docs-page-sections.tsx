import { Link } from '@tanstack/react-router';

import { getDocsNavigationItem, type DocsNavigationItem, type DocsPage } from '../../content/public-docs';

interface PublicDocsPageSectionsProps {
  page: DocsPage;
}

export function PublicDocsPageSections({ page }: PublicDocsPageSectionsProps) {
  const relatedPages = page.relatedPageIds
    .map((id) => getDocsNavigationItem(id))
    .filter((item): item is DocsNavigationItem => Boolean(item));

  return (
    <div className="mt-8 space-y-6">
      {page.sections.map((section) => (
        <section className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-8" id={section.id} key={section.id}>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Section</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-50">{section.title}</h2>
          <p className="mt-4 text-base leading-7 text-stone-300">{section.intro}</p>
          {section.body?.map((paragraph) => (
            <p className="mt-4 text-sm leading-7 text-stone-300" key={paragraph}>
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-6 space-y-3 text-sm text-stone-200">
              {section.bullets.map((bullet) => (
                <li className="flex gap-3" key={bullet}>
                  <span aria-hidden className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {section.checklist ? (
            <ol className="mt-6 space-y-3 text-sm text-stone-200">
              {section.checklist.map((item, index) => (
                <li className="flex gap-3" key={item}>
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 text-xs font-semibold text-emerald-100">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {section.codeSamples ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {section.codeSamples.map((sample) => (
                <article className="rounded-[1.5rem] border border-white/10 bg-stone-950/80 p-5" key={sample.title}>
                  <p className="text-xs uppercase tracking-[0.3em] text-orange-300">{sample.title}</p>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-emerald-100">{sample.code}</pre>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ))}
      {relatedPages.length ? (
        <section className="rounded-[2rem] border border-orange-300/20 bg-[linear-gradient(135deg,rgba(28,25,23,0.92),rgba(17,24,39,0.88))] p-7 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Continue</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-50">Keep moving through the docs area</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {relatedPages.map((item) => (
              <Link className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-stone-100 no-underline transition hover:border-white/20 hover:bg-white/[0.08]" key={item.id} to={item.to}>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-stone-300">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
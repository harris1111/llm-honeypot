import { Link } from '@tanstack/react-router';

import { getDocsNavigationItem, type DocsNavigationItem, type DocsPage } from '../../content/public-docs';
import { CodeBlock } from '../ui/code-block';

interface PublicDocsPageSectionsProps {
  page: DocsPage;
}

export function PublicDocsPageSections({ page }: PublicDocsPageSectionsProps) {
  const relatedPages = page.relatedPageIds
    .map((id) => getDocsNavigationItem(id))
    .filter((item): item is DocsNavigationItem => Boolean(item));

  return (
    <div className="mt-10 space-y-14">
      {page.sections.map((section) => {
        const codeSamples = section.codeSamples ?? [];

        return (
          <section className="scroll-mt-20" id={section.id} key={section.id}>
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">{section.intro}</p>

            {section.body?.map((paragraph) => (
              <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]" key={paragraph}>{paragraph}</p>
            ))}

            {section.bullets ? (
              <ul className="mt-5 space-y-2.5 text-[15px] leading-7 text-[var(--color-text-secondary)]">
                {section.bullets.map((bullet) => (
                  <li className="flex gap-2.5" key={bullet}>
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-text-tertiary)]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.checklist ? (
              <ol className="mt-5 space-y-3 text-[15px] leading-7 text-[var(--color-text-secondary)]">
                {section.checklist.map((item, index) => (
                  <li className="flex gap-3" key={item}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-muted)] text-sm font-semibold text-[var(--color-accent)]">{index + 1}</span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            {codeSamples.length ? (
              <div className="mt-6 space-y-4">
                {codeSamples.map((sample) => (
                  <CodeBlock key={`${section.id}-${sample.title}`} language={sample.language} title={sample.title} variants={sample.variants} />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}

      {/* Next steps */}
      {relatedPages.length ? (
        <section className="border-t border-[var(--color-border-default)] pt-10">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Next steps</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {relatedPages.map((item) => (
              <Link
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-5 no-underline transition hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]"
                key={item.id}
                to={item.to}
              >
                <p className="text-base font-medium text-[var(--color-text-primary)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

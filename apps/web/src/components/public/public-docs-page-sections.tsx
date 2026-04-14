import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';

import { getDocsNavigationItem, type DocsNavigationItem, type DocsPage } from '../../content/public-docs';
import { CodeBlock } from '../ui/code-block';
import { InlineMarkup } from '../ui/inline-markup';

interface PublicDocsPageSectionsProps {
  page: DocsPage;
}

/* ── Intersection-observer fade-in hook ── */
function useFadeIn() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('docs-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function AnimatedSection({ children, id }: { children: React.ReactNode; id: string }) {
  const ref = useFadeIn();
  return (
    <section className="docs-section scroll-mt-20" id={id} ref={ref}>
      {children}
    </section>
  );
}

/* ── Callout block ── */
const calloutStyles = {
  info: { border: 'border-[var(--color-accent)]', bg: 'bg-[var(--color-accent-muted)]', icon: 'ℹ' },
  tip: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', icon: '💡' },
  warning: { border: 'border-amber-500/40', bg: 'bg-amber-500/10', icon: '⚠' },
};

function Callout({ icon, text, variant = 'info' }: { icon?: string; text: string; variant?: 'info' | 'tip' | 'warning' }) {
  const style = calloutStyles[variant];
  return (
    <div className={`mt-5 flex gap-3 rounded-[var(--radius-lg)] border ${style.border} ${style.bg} px-4 py-3`}>
      <span className="shrink-0 text-lg">{icon ?? style.icon}</span>
      <span className="text-sm leading-6 text-[var(--color-text-primary)]"><InlineMarkup text={text} /></span>
    </div>
  );
}

/* ── Diagram block ── */
function DiagramBlock({ text }: { text: string }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-inset)] p-4">
      <pre className="text-xs leading-5 text-[var(--color-text-secondary)] sm:text-sm sm:leading-6 font-mono whitespace-pre">{text}</pre>
    </div>
  );
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
          <AnimatedSection id={section.id} key={section.id}>
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]"><InlineMarkup text={section.intro} /></p>

            {section.callout ? <Callout icon={section.callout.icon} text={section.callout.text} variant={section.callout.variant} /> : null}

            {section.diagram ? <DiagramBlock text={section.diagram} /> : null}

            {section.body?.map((paragraph) => (
              <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]" key={paragraph}><InlineMarkup text={paragraph} /></p>
            ))}

            {section.bullets ? (
              <ul className="mt-5 space-y-2.5 text-[15px] leading-7 text-[var(--color-text-secondary)]">
                {section.bullets.map((bullet) => (
                  <li className="flex gap-2.5" key={bullet}>
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                    <span><InlineMarkup text={bullet} /></span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.checklist ? (
              <ol className="mt-5 space-y-3 text-[15px] leading-7 text-[var(--color-text-secondary)]">
                {section.checklist.map((item, index) => (
                  <li className="flex gap-3" key={item}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-muted)] text-sm font-semibold text-[var(--color-accent)]">{index + 1}</span>
                    <span className="pt-0.5"><InlineMarkup text={item} /></span>
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
          </AnimatedSection>
        );
      })}

      {/* Next steps */}
      {relatedPages.length ? (
        <section className="border-t border-[var(--color-border-default)] pt-10">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Next steps</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {relatedPages.map((item) => (
              <Link
                className="group rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-5 no-underline transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5"
                key={item.id}
                to={item.to}
              >
                <p className="text-base font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

import type { FeatureCard } from '../../content/public-site-content';

interface FeaturesSectionProps {
  items: FeatureCard[];
}

export function FeaturesSection({ items }: FeaturesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8" id="features">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-info)]">// feature map</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">Shipped capabilities, not placeholder marketing.</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
          The landing page stays tied to the real repository slice: what ships today in the dashboard, node runtime, response engine, and threat-intel path.
        </p>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 transition hover:border-[var(--color-border-strong)]"
            key={item.title}
          >
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-accent)]">{item.eyebrow}</p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
            <p className="mt-2 text-xs leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-text-primary)]">
              {item.bullets.map((bullet) => (
                <li className="flex gap-2" key={bullet}>
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

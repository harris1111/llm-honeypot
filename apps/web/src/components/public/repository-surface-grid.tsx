import type { SurfaceCard } from '../../content/public-site-content';

interface RepositorySurfaceGridProps {
  description: string;
  items: SurfaceCard[];
  kicker: string;
  title: string;
}

export function RepositorySurfaceGrid({ description, items, kicker, title }: RepositorySurfaceGridProps) {
  return (
    <section className="mt-12">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-accent)]">{kicker}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <article
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 transition hover:border-[var(--color-border-strong)]"
            key={item.path}
          >
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-info)]">{item.path}</p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
            <p className="mt-2 text-xs leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-text-primary)]">
              {item.highlights.map((highlight) => (
                <li className="flex gap-2" key={highlight}>
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

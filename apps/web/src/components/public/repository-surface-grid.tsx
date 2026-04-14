import type { SurfaceCard } from '../../content/public-site-content';

interface RepositorySurfaceGridProps {
  description: string;
  items: SurfaceCard[];
  kicker: string;
  title: string;
}

export function RepositorySurfaceGrid({ description, items, kicker, title }: RepositorySurfaceGridProps) {
  return (
    <section className="mt-14">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">{kicker}</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-50">{title}</h2>
        <p className="mt-4 text-base leading-7 text-stone-300">{description}</p>
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {items.map((item) => (
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6" key={item.path}>
            <p className="text-xs uppercase tracking-[0.3em] text-orange-300">{item.path}</p>
            <h3 className="mt-4 text-2xl font-semibold text-stone-50">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">{item.description}</p>
            <ul className="mt-5 space-y-3 text-sm text-stone-200">
              {item.highlights.map((highlight) => (
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
  );
}
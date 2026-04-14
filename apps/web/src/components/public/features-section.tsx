import type { FeatureCard } from '../../content/public-site-content';

interface FeaturesSectionProps {
  items: FeatureCard[];
}

export function FeaturesSection({ items }: FeaturesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8" id="features">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Feature map</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">Shipped capabilities, not placeholder marketing.</h2>
        <p className="mt-4 text-base leading-7 text-stone-300">
          The landing page stays tied to the real repository slice: what ships today in the dashboard, node runtime, response engine, and threat-intel path.
        </p>
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {items.map((item) => (
          <article
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur"
            key={item.title}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{item.eyebrow}</p>
            <h3 className="mt-4 text-2xl font-semibold text-stone-50">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">{item.description}</p>
            <ul className="mt-5 space-y-3 text-sm text-stone-200">
              {item.bullets.map((bullet) => (
                <li className="flex gap-3" key={bullet}>
                  <span aria-hidden className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-300" />
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
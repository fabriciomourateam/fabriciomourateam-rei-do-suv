import Image from 'next/image'
import Link from 'next/link'
import type { SiteContent } from '@/lib/content'
import type { Vehicle } from '@/lib/types'
import { vehicleName, yearLabel } from '@/lib/vehicles'
import { ArrowIcon } from './icons'
import { Rich } from './rich'
import { WaButton } from './wa-button'

export function Hero({ featured, hero, visitHref }: { featured?: Vehicle; hero: SiteContent['hero']; visitHref: string }) {
  const cover = featured?.photos[0]
  const second = featured?.photos[1]

  return (
    <section className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden md:items-center">
      {/* Fundo: brilho dourado + marca d'água */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-[-10%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_62%)] blur-2xl" />
        <div className="absolute bottom-[-30%] left-[-15%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08),transparent_60%)]" />
        <span className="font-display absolute -bottom-6 left-1/2 hidden -translate-x-1/2 text-[22vw] leading-none whitespace-nowrap text-white/[0.025] md:block">
          REI
        </span>
      </div>

      {/* Mobile: foto em tela cheia */}
      {cover && (
        <div className="absolute inset-0 -z-10 md:hidden">
          <Image src={cover} alt="" fill priority sizes="100vw" className="animate-slow-zoom object-cover object-[50%_60%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/10" />
        </div>
      )}

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pt-28 pb-12 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:pt-32 md:pb-24">
        <div>
          <p data-reveal className="mb-6 flex items-center gap-3 text-[11px] tracking-[0.34em] text-gold-light uppercase">
            <span className="h-px w-10 bg-gold" />
            {hero.eyebrow}
          </p>

          <h1 data-reveal style={{ '--d': '80ms' } as React.CSSProperties} className="leading-[0.95]">
            <span className="font-display block text-[clamp(2.3rem,6.2vw,5.2rem)] text-silver">
              <Rich text={hero.titleTop} accent="text-gold" />
            </span>
            <span className="font-serif mt-3 block text-[clamp(2.4rem,6vw,5rem)] leading-[1] font-medium italic text-gold">
              <Rich text={hero.titleBottom} accent="text-gold-light" />
            </span>
          </h1>

          <p data-reveal style={{ '--d': '160ms' } as React.CSSProperties} className="mt-7 max-w-xl text-[15px] leading-relaxed text-text/70 md:text-[17px]">
            <Rich text={hero.subtitle} />
          </p>

          <div data-reveal style={{ '--d': '240ms' } as React.CSSProperties} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#estoque" className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold tracking-wide">
              {hero.ctaPrimary} <ArrowIcon />
            </a>
            <WaButton href={visitHref} className="btn-ghost inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-medium">
              {hero.ctaSecondary}
            </WaButton>
          </div>

          <dl data-reveal style={{ '--d': '320ms' } as React.CSSProperties} className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-gold pt-7 sm:grid-cols-4">
            {hero.proof.map((p, i) => (
              <div key={i}>
                <dt className="text-[13px] font-semibold text-gold-light">{p.title}</dt>
                <dd className="mt-1 text-[12px] leading-snug text-muted">{p.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Desktop: moldura retrato com o carro destaque */}
        {cover && featured && (
          <div className="relative hidden md:block">
            <div data-reveal style={{ '--d': '200ms' } as React.CSSProperties} className="relative ml-auto aspect-[4/5] w-full max-w-[460px]">
              <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-[var(--gold-light)]/60 via-[var(--gold)]/10 to-[var(--gold)]/40" />
              <div className="absolute inset-0 overflow-hidden rounded-[27px] bg-coal">
                <Image src={cover} alt={vehicleName(featured)} fill priority sizes="460px" className="animate-slow-zoom object-cover object-[50%_62%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              </div>
              <Link
                href={`/estoque/${featured.slug}`}
                className="group absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md transition hover:border-[var(--gold)]/50"
              >
                <div>
                  <p className="text-[10px] tracking-[0.3em] text-gold-light uppercase">{hero.featuredLabel}</p>
                  <p className="font-display mt-1.5 text-lg text-text">{vehicleName(featured)}</p>
                  <p className="text-[13px] text-text/60">
                    {[featured.version, yearLabel(featured)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/50 text-gold-light transition group-hover:bg-[var(--gold)] group-hover:text-ink">
                  <ArrowIcon />
                </span>
              </Link>
            </div>
            {second && (
              <div data-reveal style={{ '--d': '420ms' } as React.CSSProperties} className="absolute -top-8 -left-6 hidden aspect-[3/4] w-36 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60 lg:block">
                <Image src={second} alt="" fill sizes="160px" className="object-cover object-[50%_55%]" />
              </div>
            )}
          </div>
        )}
      </div>

      <a href="#estoque" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.3em] text-muted uppercase md:flex" aria-label="Rolar para o estoque">
        {hero.scrollLabel}
        <span className="h-10 w-px bg-gradient-to-b from-[var(--gold)] to-transparent" />
      </a>
    </section>
  )
}

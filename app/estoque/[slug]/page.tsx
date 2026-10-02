import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Gallery } from '@/components/site/gallery'
import { Header } from '@/components/site/header'
import { ArrowIcon, CrownIcon } from '@/components/site/icons'
import { RevealObserver } from '@/components/site/reveal'
import { Footer, WaFloat } from '@/components/site/sections'
import { VehicleCard } from '@/components/site/vehicle-card'
import { WaButton } from '@/components/site/wa-button'
import { Rich } from '@/components/site/rich'
import { fillCar } from '@/lib/content'
import { getSiteContent } from '@/lib/content-store'
import { getSiteConfig, getVehicleBySlug, getVehicles } from '@/lib/data'
import { STATUS_LABEL, carDescription, formatKm, specList, vehicleName, waLink, yearLabel } from '@/lib/vehicles'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = await getVehicleBySlug(slug)
  if (!v) return { title: 'Veículo não encontrado' }
  const title = `${vehicleName(v)} ${v.version} ${yearLabel(v)}`.replace(/\s+/g, ' ').trim()
  const description = v.headline || [v.highlights.slice(0, 3).join(', '), formatKm(v.km)].filter(Boolean).join(' · ')
  return {
    title,
    description,
    openGraph: { title: `${title} | Rei do SUV`, description },
  }
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params
  const [v, config, all, content] = await Promise.all([getVehicleBySlug(slug), getSiteConfig(), getVehicles(), getSiteContent()])
  if (!v) notFound()

  const sold = v.status === 'vendido'
  const vp = content.vehiclePage
  const waGeneral = waLink(config.whatsapp, content.whatsapp.general)
  const waHref = waLink(config.whatsapp, fillCar(sold ? content.whatsapp.sold : content.whatsapp.vehicle, carDescription(v)))
  const visibleIds = content.sections.filter((s) => s.visible !== false).map((s) => s.id)
  const cardTexts = {
    cta: content.inventory.cta,
    ctaSold: content.inventory.ctaSold,
    vehicleTemplate: content.whatsapp.vehicle,
    soldTemplate: content.whatsapp.sold,
  }
  const others = all.filter((o) => o.id !== v.id && o.status !== 'vendido').slice(0, 3)
  const specs = specList(v)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicleName(v)} ${v.version}`,
    brand: { '@type': 'Brand', name: v.brand },
    model: v.model,
    vehicleModelDate: v.yearModel ?? undefined,
    mileageFromOdometer: v.km ? { '@type': 'QuantitativeValue', value: v.km, unitCode: 'KMT' } : undefined,
    color: v.color || undefined,
    vehicleTransmission: v.transmission || undefined,
    image: v.photos,
    description: v.description || v.headline,
  }

  return (
    <>
      <Header waHref={waGeneral} visibleIds={visibleIds} />
      <main className="px-5 pt-24 pb-20 md:px-8 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-6 flex items-center gap-2 text-[12px] tracking-[0.14em] text-muted uppercase">
            <Link href="/" className="hover:text-gold-light">Início</Link>
            <span className="text-gold/50">/</span>
            <Link href="/#estoque" className="hover:text-gold-light">Estoque</Link>
            <span className="text-gold/50">/</span>
            <span className="text-text/70">{v.model}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Gallery photos={v.photos} alt={`${vehicleName(v)} ${v.version}`} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                {v.status !== 'disponivel' ? (
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${sold ? 'bg-white text-ink' : 'border border-[var(--gold)]/60 text-gold-light'}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-gold-light uppercase">
                    <CrownIcon className="h-3 w-3" /> {vp.badge}
                  </span>
                )}
              </div>

              <p className="mt-6 text-[12px] tracking-[0.32em] text-gold-light uppercase">{v.brand}</p>
              <h1 className="font-display mt-2 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.92] text-silver">{v.model}</h1>
              {v.version && <p className="mt-3 text-lg text-text/75 md:text-xl">{v.version}</p>}
              {v.headline && <p className="font-serif mt-6 text-2xl leading-snug text-gold italic md:text-[28px]">“{v.headline}”</p>}

              <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gold bg-[var(--line)] sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.label} className="bg-coal px-4 py-4">
                    <dt className="text-[10px] tracking-[0.24em] text-muted uppercase">{s.label}</dt>
                    <dd className="mt-1.5 text-[15px] font-medium text-text">{s.value}</dd>
                  </div>
                ))}
              </dl>

              {v.highlights.length > 0 && (
                <div className="mt-9">
                  <h2 className="text-[11px] tracking-[0.3em] text-gold-light uppercase">{vp.highlightsTitle}</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {v.highlights.map((h) => (
                      <li key={h} className="rounded-full border border-white/12 bg-coal px-4 py-2 text-[13px] text-text/85">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {v.description && (
                <div className="mt-9">
                  <h2 className="text-[11px] tracking-[0.3em] text-gold-light uppercase">{vp.aboutTitle}</h2>
                  <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-text/70">{v.description}</p>
                </div>
              )}

              <div className="mt-10 hidden flex-col gap-3 sm:flex sm:flex-row">
                <WaButton href={waHref} vehicleId={sold ? undefined : v.id} className="btn-gold flex flex-1 items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold">
                  {sold ? vp.ctaSold : vp.cta}
                </WaButton>
              </div>
              <p className="mt-4 hidden text-[13px] text-muted sm:block"><Rich text={vp.note} /></p>

              <div className="mt-12 rounded-2xl border border-white/[0.07] bg-coal p-6">
                <p className="text-[11px] tracking-[0.3em] text-gold-light uppercase">{vp.pillarsTitle}</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {content.pillars.items.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-text/75">
                      <CrownIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
                      {p.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {others.length > 0 && (
            <section className="mt-28">
              <div className="mb-10 flex items-end justify-between gap-6">
                <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-none">
                  <Rich text={vp.othersTitle} base="text-silver" accent="text-gold" />
                </h2>
                <Link href="/#estoque" className="hidden items-center gap-2 text-[13px] text-text/70 hover:text-gold-light sm:flex">
                  Ver todo o estoque <ArrowIcon />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                {others.map((o) => (
                  <VehicleCard key={o.id} v={o} whatsapp={config.whatsapp} texts={cardTexts} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Barra fixa no mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold bg-ink/90 p-3 backdrop-blur-xl sm:hidden">
        <WaButton href={waHref} vehicleId={sold ? undefined : v.id} className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold">
          {sold ? vp.ctaSold : vp.cta}
        </WaButton>
      </div>

      <Footer config={config} waHref={waGeneral} />
      <div className="hidden sm:block">
        <WaFloat waHref={waHref} />
      </div>
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}

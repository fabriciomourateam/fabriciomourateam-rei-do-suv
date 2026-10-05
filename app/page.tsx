import { Fragment } from 'react'
import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { InventoryGrid } from '@/components/site/inventory'
import { Rich } from '@/components/site/rich'
import { RevealObserver } from '@/components/site/reveal'
import { Eyebrow, Faq, FinalCta, Footer, Manifesto, Marquee, Pillars, Steps, Visit, WaFloat } from '@/components/site/sections'
import { WaButton } from '@/components/site/wa-button'
import type { SectionId } from '@/lib/content'
import { getSiteContent } from '@/lib/content-store'
import { getSiteConfig, getVehicles } from '@/lib/data'
import { waLink } from '@/lib/vehicles'

export const revalidate = 60

export default async function Home() {
  const [vehicles, config, content] = await Promise.all([getVehicles(), getSiteConfig(), getSiteContent()])
  const available = vehicles.filter((v) => v.status !== 'vendido')
  const featured = available.find((v) => v.featured && v.photos.length) ?? available.find((v) => v.photos.length)
  const visitPhoto = featured?.photos[1] ?? featured?.photos[0]
  const waGeneral = waLink(config.whatsapp, content.whatsapp.general)
  const waVisit = waLink(config.whatsapp, content.whatsapp.visit)
  const visibleSections = content.sections.filter((s) => s.visible !== false)
  const visibleIds = visibleSections.map((s) => s.id)
  const inv = content.inventory

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Rei do SUV Multimarcas',
    description: content.seo.description,
    telephone: `+${config.whatsapp}`,
    areaServed: config.city,
    image: '/logo.jpg',
  }

  const blocks: Record<SectionId, React.ReactNode> = {
    marquee: <Marquee items={content.marquee} />,
    manifesto: <Manifesto content={content.manifesto} />,
    inventory: (
      <section id="estoque" className="scroll-mt-20 px-5 pb-28 md:px-8 md:pb-36">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="mb-12 text-center md:mb-14">
            <Eyebrow center>{inv.eyebrow}</Eyebrow>
            <h2 className="font-display mt-6 text-[clamp(2rem,4.8vw,3.8rem)] leading-[0.95] text-silver">
              <Rich text={inv.title} />
            </h2>
            <p className="font-serif mt-4 text-xl text-gold italic md:text-2xl">
              <Rich text={inv.subtitle} accent="text-gold-light" />
            </p>
          </div>
          {vehicles.length ? (
            <InventoryGrid
              vehicles={vehicles}
              whatsapp={config.whatsapp}
              filterAll={inv.filterAll}
              texts={{ cta: inv.cta, ctaSold: inv.ctaSold, vehicleTemplate: content.whatsapp.vehicle, soldTemplate: content.whatsapp.sold, featuredBadge: inv.featuredBadge }}
            />
          ) : (
            <div className="mx-auto max-w-lg rounded-[22px] border border-gold bg-coal p-10 text-center">
              <p className="text-text/70">
                <Rich text={inv.empty} />
              </p>
              <WaButton href={waGeneral} className="btn-gold mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold">
                {inv.emptyCta}
              </WaButton>
            </div>
          )}
        </div>
      </section>
    ),
    pillars: <Pillars content={content.pillars} />,
    steps: <Steps content={content.steps} />,
    visit: <Visit content={content.visit} config={config} visitHref={waVisit} photo={visitPhoto} />,
    faq: <Faq content={content.faq} />,
    finalCta: <FinalCta content={content.finalCta} waHref={waGeneral} />,
  }

  return (
    <>
      <Header waHref={waGeneral} visibleIds={visibleIds} content={content.header} />
      <main>
        <Hero featured={featured} hero={content.hero} visitHref={waVisit} />
        {visibleSections.map((s) => (
          <Fragment key={s.id}>{blocks[s.id]}</Fragment>
        ))}
      </main>
      <Footer config={config} waHref={waGeneral} content={content.footer} />
      <WaFloat waHref={waGeneral} label={content.header.whatsappButton} />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}

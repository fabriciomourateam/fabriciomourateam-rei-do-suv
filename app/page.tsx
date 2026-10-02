import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { InventoryGrid } from '@/components/site/inventory'
import { RevealObserver } from '@/components/site/reveal'
import { Eyebrow, Faq, FinalCta, Footer, Manifesto, Marquee, Pillars, Steps, Visit, WaFloat } from '@/components/site/sections'
import { WaButton } from '@/components/site/wa-button'
import { INVENTORY } from '@/lib/copy'
import { getSiteConfig, getVehicles } from '@/lib/data'
import { WA_MESSAGES, waLink } from '@/lib/vehicles'

export const revalidate = 60

export default async function Home() {
  const [vehicles, config] = await Promise.all([getVehicles(), getSiteConfig()])
  const available = vehicles.filter((v) => v.status !== 'vendido')
  const featured = available.find((v) => v.featured && v.photos.length) ?? available.find((v) => v.photos.length)
  const visitPhoto = featured?.photos[1] ?? featured?.photos[0]
  const waGeneral = waLink(config.whatsapp, WA_MESSAGES.general)
  const waVisit = waLink(config.whatsapp, WA_MESSAGES.visit)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Rei do SUV Multimarcas',
    description: 'Curadoria de SUVs premium topo de linha com baixa quilometragem.',
    telephone: `+${config.whatsapp}`,
    areaServed: config.city,
    image: '/logo.jpg',
  }

  return (
    <>
      <Header waHref={waGeneral} />
      <main>
        <Hero featured={featured} config={config} visitHref={waVisit} />
        <Marquee />
        <Manifesto />

        <section id="estoque" className="scroll-mt-20 px-5 pb-28 md:px-8 md:pb-36">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mb-12 text-center md:mb-14">
              <Eyebrow center>{INVENTORY.eyebrow}</Eyebrow>
              <h2 className="font-display mt-6 text-[clamp(2rem,4.8vw,3.8rem)] leading-[0.95] text-silver">{INVENTORY.title}</h2>
              <p className="font-serif mt-4 text-xl text-gold italic md:text-2xl">{INVENTORY.subtitle}</p>
            </div>
            {vehicles.length ? (
              <InventoryGrid vehicles={vehicles} whatsapp={config.whatsapp} />
            ) : (
              <div className="mx-auto max-w-lg rounded-[22px] border border-gold bg-coal p-10 text-center">
                <p className="text-text/70">{INVENTORY.empty}</p>
                <WaButton href={waGeneral} className="btn-gold mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold">
                  Quero saber primeiro
                </WaButton>
              </div>
            )}
          </div>
        </section>

        <Pillars />
        <Steps />
        <Visit config={config} visitHref={waVisit} photo={visitPhoto} />
        <Faq />
        <FinalCta waHref={waGeneral} />
      </main>
      <Footer config={config} waHref={waGeneral} />
      <WaFloat waHref={waGeneral} />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}

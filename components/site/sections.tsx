import Image from 'next/image'
import Link from 'next/link'
import { FAQ, FINAL_CTA, MANIFESTO, MARQUEE, PILLARS, STEPS, VISIT } from '@/lib/copy'
import type { SiteConfig } from '@/lib/types'
import { normalizePhone } from '@/lib/vehicles'
import { CrownIcon, GaugeIcon, GemIcon, InstagramIcon, PlusIcon, ShieldIcon, SparkleIcon, TikTokIcon, WhatsAppIcon } from './icons'
import { WaButton } from './wa-button'

type CSS = React.CSSProperties

export function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] tracking-[0.34em] text-gold-light uppercase ${center ? 'justify-center' : ''}`}>
      <span className="h-px w-8 bg-gold" />
      {children}
      {center && <span className="h-px w-8 bg-gold" />}
    </p>
  )
}

export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="relative overflow-hidden border-y border-gold bg-coal py-5" aria-hidden>
      <div className="animate-marquee flex w-max items-center gap-10">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-sm tracking-[0.2em] text-text/60 md:text-base">{t}</span>
            <CrownIcon className="h-3.5 w-3.5 text-[var(--gold)]" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-coal to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-coal to-transparent" />
    </div>
  )
}

export function Manifesto() {
  return (
    <section className="relative px-5 py-28 md:px-8 md:py-40">
      <div className="mx-auto max-w-5xl text-center">
        <div data-reveal>
          <Eyebrow center>{MANIFESTO.eyebrow}</Eyebrow>
        </div>
        <h2 data-reveal style={{ '--d': '100ms' } as CSS} className="font-serif mt-8 text-[clamp(2.2rem,5.4vw,4.4rem)] leading-[1.05] font-medium text-text">
          A gente <em className="text-gold">recusa</em> mais carros
          <br className="hidden md:block" /> do que compra.
        </h2>
        <p data-reveal style={{ '--d': '200ms' } as CSS} className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-text/65 md:text-[17px]">
          {MANIFESTO.body}
        </p>
      </div>
    </section>
  )
}

const PILLAR_ICONS = [GemIcon, GaugeIcon, ShieldIcon, SparkleIcon]

export function Pillars() {
  return (
    <section id="padrao" className="relative scroll-mt-20 overflow-hidden bg-coal px-5 py-28 md:px-8 md:py-36">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 rule-gold" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div data-reveal>
            <Eyebrow>O Padrão Rei</Eyebrow>
            <h2 className="font-display mt-6 text-[clamp(2rem,4.6vw,3.6rem)] leading-[0.95]">
              <span className="text-silver">Quatro regras.</span>
              <br />
              <span className="text-gold">Nenhuma exceção.</span>
            </h2>
          </div>
          <p data-reveal style={{ '--d': '120ms' } as CSS} className="max-w-lg text-[15px] leading-relaxed text-text/65 md:justify-self-end md:text-base">
            Todo carro que entra no nosso estoque passa pelo mesmo crivo. Se falhar em uma delas, não chega até você.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-gold bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => {
            const Icon = PILLAR_ICONS[i]
            return (
              <div key={p.title} data-reveal style={{ '--d': `${i * 90}ms` } as CSS} className="group relative bg-coal p-8 transition duration-500 hover:bg-coal-2 md:p-10">
                <span className="font-display absolute top-7 right-7 text-sm text-white/15">0{i + 1}</span>
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold)]/35 text-gold-light transition duration-500 group-hover:bg-[var(--gold)] group-hover:text-ink">
                  <Icon />
                </span>
                <h3 className="font-display mt-8 text-lg text-text">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-text/60">{p.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Steps() {
  return (
    <section className="px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="text-center">
          <Eyebrow center>Como funciona</Eyebrow>
          <h2 className="font-serif mt-6 text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.05] font-medium">
            Do primeiro olhar <em className="text-gold">à chave na mão.</em>
          </h2>
        </div>
        <ol className="relative mt-20 grid gap-12 md:grid-cols-4 md:gap-8">
          <div className="pointer-events-none absolute top-7 right-[12%] left-[12%] hidden h-px rule-gold md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={{ '--d': `${i * 110}ms` } as CSS} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
              <span className="font-display relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/50 bg-ink text-base text-gold">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-base text-text md:mt-6">{s.title}</h3>
                <p className="mt-2 max-w-[17rem] text-[14px] leading-relaxed text-text/60">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Visit({ config, visitHref, photo }: { config: SiteConfig; visitHref: string; photo?: string }) {
  return (
    <section id="visita" className="scroll-mt-20 px-5 pb-28 md:px-8 md:pb-36">
      <div className="grain relative mx-auto grid max-w-7xl overflow-hidden rounded-[28px] border border-gold bg-coal md:grid-cols-2">
        <div className="relative min-h-[380px] md:min-h-[620px]">
          {photo && <Image src={photo} alt="Carro aguardando visita agendada" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover object-[50%_45%]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/20 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-coal" />
        </div>
        <div className="relative flex flex-col justify-center p-8 md:p-14 lg:p-20">
          <div data-reveal>
            <Eyebrow>{VISIT.eyebrow}</Eyebrow>
          </div>
          <h2 data-reveal style={{ '--d': '100ms' } as CSS} className="font-serif mt-6 text-[clamp(2rem,3.8vw,3.2rem)] leading-[1.05] font-medium">
            Sem vitrine lotada.
            <br />
            <em className="text-gold">Sem vendedor te cercando.</em>
          </h2>
          <p data-reveal style={{ '--d': '180ms' } as CSS} className="mt-6 text-[15px] leading-relaxed text-text/65">
            {VISIT.body}
          </p>
          <dl data-reveal style={{ '--d': '240ms' } as CSS} className="mt-8 grid gap-4 border-t border-gold pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] tracking-[0.28em] text-muted uppercase">Onde</dt>
              <dd className="mt-1 text-text/85">{config.city}</dd>
              <dd className="text-[13px] text-text/50">{config.addressNote}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.28em] text-muted uppercase">Quando</dt>
              <dd className="mt-1 text-text/85">{config.hours}</dd>
            </div>
          </dl>
          <div data-reveal style={{ '--d': '300ms' } as CSS} className="mt-9">
            <WaButton href={visitHref} className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold">
              {VISIT.cta}
            </WaButton>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Faq() {
  return (
    <section id="duvidas" className="scroll-mt-20 border-t border-white/[0.06] px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal>
          <Eyebrow>Dúvidas</Eyebrow>
          <h2 className="font-display mt-6 text-[clamp(1.9rem,4vw,3rem)] leading-[0.95]">
            <span className="text-silver">Perguntas</span>
            <br />
            <span className="text-gold">frequentes</span>
          </h2>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-text/55">Não achou o que procurava? Chama a gente — resposta rápida, de gente de verdade.</p>
        </div>
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {FAQ.map((f, i) => (
            <details key={f.q} data-reveal style={{ '--d': `${i * 60}ms` } as CSS} className="group py-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-[16px] font-medium text-text/90 transition hover:text-gold-light md:text-[17px]">
                {f.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-[var(--gold)] transition duration-300 group-open:rotate-45 group-open:border-[var(--gold)]">
                  <PlusIcon />
                </span>
              </summary>
              <p className="mt-4 max-w-2xl pr-10 text-[15px] leading-relaxed text-text/60">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCta({ waHref }: { waHref: string }) {
  return (
    <section className="grain relative overflow-hidden px-5 py-32 md:px-8 md:py-44">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.2),transparent_60%)]" />
      </div>
      <div className="relative mx-auto max-w-4xl text-center">
        <div data-reveal>
          <Image src="/logo.jpg" alt="" width={88} height={88} className="mx-auto h-20 w-20 rounded-full ring-1 ring-[var(--gold)]/40" />
        </div>
        <h2 data-reveal style={{ '--d': '100ms' } as CSS} className="font-display mt-10 text-[clamp(2rem,5.4vw,4.2rem)] leading-[0.98] text-silver">
          {FINAL_CTA.title}
        </h2>
        <p data-reveal style={{ '--d': '180ms' } as CSS} className="font-serif mt-6 text-2xl text-gold italic md:text-3xl">
          {FINAL_CTA.subtitle}
        </p>
        <div data-reveal style={{ '--d': '260ms' } as CSS} className="mt-12">
          <WaButton href={waHref} className="btn-gold inline-flex items-center gap-3 rounded-full px-10 py-5 text-[15px] font-semibold">
            {FINAL_CTA.cta}
          </WaButton>
        </div>
      </div>
    </section>
  )
}

function igUrl(v: string) {
  if (!v) return ''
  return v.startsWith('http') ? v : `https://instagram.com/${v.replace(/^@/, '')}`
}
function ttUrl(v: string) {
  if (!v) return ''
  return v.startsWith('http') ? v : `https://www.tiktok.com/@${v.replace(/^@/, '')}`
}
function formatPhone(raw: string) {
  const d = normalizePhone(raw).slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

export function Footer({ config, waHref }: { config: SiteConfig; waHref: string }) {
  const ig = igUrl(config.instagram)
  const tt = ttUrl(config.tiktok)
  return (
    <footer className="border-t border-gold bg-coal px-5 pt-16 pb-28 md:px-8 md:pb-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Rei do SUV" width={64} height={64} className="h-16 w-16 rounded-full" />
          <div>
            <p className="font-display text-lg text-gold">Rei do SUV</p>
            <p className="text-[13px] text-muted">SUVs premium · {config.city}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WaButton href={waHref} className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm">
            {formatPhone(config.whatsapp)}
          </WaButton>
          {ig && (
            <a href={ig} target="_blank" rel="noopener noreferrer" className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full" aria-label="Instagram">
              <InstagramIcon />
            </a>
          )}
          {tt && (
            <a href={tt} target="_blank" rel="noopener noreferrer" className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full" aria-label="TikTok">
              <TikTokIcon />
            </a>
          )}
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/[0.06] pt-6 text-[12px] text-muted md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Rei do SUV Multimarcas. Todos os direitos reservados.</p>
        <Link href="/painel" className="transition hover:text-gold-light">
          Área da equipe
        </Link>
      </div>
    </footer>
  )
}

/** Botão flutuante (mobile) */
export function WaFloat({ waHref }: { waHref: string }) {
  return (
    <WaButton
      href={waHref}
      icon={false}
      label="Falar no WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-6px_rgba(37,211,102,0.55)] transition hover:scale-105 md:right-6 md:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </WaButton>
  )
}

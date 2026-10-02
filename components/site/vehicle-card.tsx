import Image from 'next/image'
import Link from 'next/link'
import { fillCar } from '@/lib/content'
import type { Vehicle } from '@/lib/types'
import { STATUS_LABEL, carDescription, formatKm, vehicleName, waLink, yearLabel } from '@/lib/vehicles'
import { ArrowIcon, CrownIcon } from './icons'
import { WaButton } from './wa-button'

export interface CardTexts {
  cta: string
  ctaSold: string
  vehicleTemplate: string
  soldTemplate: string
}

export function VehicleCard({ v, whatsapp, texts, priority = false }: { v: Vehicle; whatsapp: string; texts: CardTexts; priority?: boolean }) {
  const sold = v.status === 'vendido'
  const href = `/estoque/${v.slug}`
  const meta = [yearLabel(v), formatKm(v.km)].filter(Boolean).join('  ·  ')

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-coal transition duration-500 hover:-translate-y-1 hover:border-[var(--gold)]/35 hover:shadow-[0_30px_60px_-30px_rgba(212,175,55,0.35)]">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden" aria-label={`Ver ${vehicleName(v)} ${v.version}`}>
        {v.photos[0] ? (
          <Image
            src={v.photos[0]}
            alt={`${vehicleName(v)} ${v.version}`}
            fill
            priority={priority}
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className={`object-cover object-[50%_60%] transition duration-[1.2s] ease-out group-hover:scale-[1.04] ${sold ? 'grayscale-[0.7]' : ''}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-coal-2 text-[var(--gold)]/40">
            <CrownIcon className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/10 to-transparent" />

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {v.featured && !sold && (
            <span className="bg-gold rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-ink uppercase">Destaque</span>
          )}
          {v.status !== 'disponivel' && (
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase backdrop-blur ${
                sold ? 'bg-white/90 text-ink' : 'border border-[var(--gold)]/60 bg-black/50 text-gold-light'
              }`}
            >
              {STATUS_LABEL[v.status]}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[11px] tracking-[0.28em] text-gold-light/90 uppercase">{v.brand}</p>
          <h3 className="font-display mt-1 text-[26px] leading-none text-text">{v.model}</h3>
          {v.version && <p className="mt-1.5 text-sm text-text/70">{v.version}</p>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-5">
        {meta && <p className="text-[13px] tracking-wide text-muted">{meta}</p>}
        {v.highlights.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {v.highlights.slice(0, 3).map((h) => (
              <li key={h} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-text/75">
                {h}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex gap-2 pt-1">
          {sold ? (
            <WaButton
              href={waLink(whatsapp, fillCar(texts.soldTemplate, carDescription(v)))}
              className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13px]"
            >
              {texts.ctaSold}
            </WaButton>
          ) : (
            <WaButton href={waLink(whatsapp, fillCar(texts.vehicleTemplate, carDescription(v)))} vehicleId={v.id} className="btn-gold flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold">
              {texts.cta}
            </WaButton>
          )}
          <Link
            href={href}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-white/15 text-text/80 transition hover:border-[var(--gold)] hover:text-gold-light"
            aria-label="Ver detalhes"
          >
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  )
}

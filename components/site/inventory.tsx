'use client'

import { useMemo, useState } from 'react'
import type { Vehicle } from '@/lib/types'
import { VehicleCard, type CardTexts } from './vehicle-card'

export function InventoryGrid({ vehicles, whatsapp, texts, filterAll }: { vehicles: Vehicle[]; whatsapp: string; texts: CardTexts; filterAll: string }) {
  const models = useMemo(() => Array.from(new Set(vehicles.map((v) => v.model))).sort(), [vehicles])
  const [active, setActive] = useState<string | null>(null)
  const list = active === null ? vehicles : vehicles.filter((v) => v.model === active)

  return (
    <>
      {models.length > 1 && (
        <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:justify-center md:px-0">
          {[null, ...models].map((m) => (
            <button
              key={m ?? '__all__'}
              type="button"
              onClick={() => setActive(m)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-[12px] tracking-[0.14em] uppercase transition ${
                active === m ? 'bg-gold font-semibold text-ink' : 'border border-white/12 text-text/70 hover:border-[var(--gold)]/60 hover:text-text'
              }`}
            >
              {m ?? filterAll}
            </button>
          ))}
        </div>
      )}
      <div className={`grid gap-5 sm:grid-cols-2 lg:gap-7 ${list.length < 3 ? "mx-auto max-w-4xl" : "lg:grid-cols-3"}`}>
        {list.map((v, i) => (
          <div key={v.id}>
            <VehicleCard v={v} whatsapp={whatsapp} texts={texts} priority={i < 2} />
          </div>
        ))}
      </div>
    </>
  )
}

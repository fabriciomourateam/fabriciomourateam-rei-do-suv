import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { formatKm, rowToVehicle, STATUS_LABEL, vehicleName, yearLabel } from '@/lib/vehicles'
import type { Vehicle, VehicleRow, VehicleStatus } from '@/lib/types'
import { DeleteButton } from './delete-button'
import { moveVehicle, setStatus, toggleField } from './actions'

const BADGE: Record<VehicleStatus, string> = {
  disponivel: 'border-emerald-500/40 text-emerald-400',
  reservado: 'border-amber-500/40 text-amber-400',
  vendido: 'border-white/20 text-muted',
}

function Pill({ on, children }: { on: boolean; children: React.ReactNode }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${on ? 'border-gold text-gold-light' : 'border-white/10 text-muted/60'}`}>{children}</span>
}

function Actions({ v, first, last }: { v: Vehicle; first: boolean; last: boolean }) {
  const small = 'rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-muted hover:border-gold hover:text-gold-light disabled:opacity-30'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['disponivel', 'reservado', 'vendido'] as const).map((s) => (
        <form key={s} action={setStatus}>
          <input type="hidden" name="id" value={v.id} />
          <input type="hidden" name="status" value={s} />
          <button disabled={v.status === s} className={`${small} ${v.status === s ? '!border-gold !text-gold-light !opacity-100' : ''}`}>{STATUS_LABEL[s]}</button>
        </form>
      ))}
      <form action={toggleField}>
        <input type="hidden" name="id" value={v.id} />
        <input type="hidden" name="field" value="visible" />
        <input type="hidden" name="value" value={String(!v.visible)} />
        <button className={small}>{v.visible ? 'Ocultar' : 'Mostrar'}</button>
      </form>
      <form action={toggleField}>
        <input type="hidden" name="id" value={v.id} />
        <input type="hidden" name="field" value="featured" />
        <input type="hidden" name="value" value={String(!v.featured)} />
        <button className={small}>{v.featured ? '★ Tirar destaque' : '☆ Destacar'}</button>
      </form>
      {(['up', 'down'] as const).map((d) => (
        <form key={d} action={moveVehicle}>
          <input type="hidden" name="id" value={v.id} />
          <input type="hidden" name="dir" value={d} />
          <button disabled={d === 'up' ? first : last} className={small} aria-label={d === 'up' ? 'Subir' : 'Descer'}>{d === 'up' ? '↑' : '↓'}</button>
        </form>
      ))}
      <Link href={`/painel/veiculos/${v.id}`} className="btn-ghost rounded-lg px-3 py-1.5 text-xs">Editar</Link>
      <DeleteButton id={v.id} name={vehicleName(v)} />
    </div>
  )
}

export default async function VeiculosPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('suv_vehicles')
    .select('*, suv_photos(url, sort_order)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  const vehicles = ((data ?? []) as VehicleRow[]).map(rowToVehicle)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-gold text-2xl">Veículos</h1>
        <Link href="/painel/veiculos/novo" className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold uppercase tracking-widest">Novo veículo</Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="mt-10 text-muted">Nenhum veículo cadastrado ainda.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {vehicles.map((v, i) => (
            <li key={v.id} className="rounded-xl border border-gold bg-coal p-4">
              <div className="flex gap-4">
                {v.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photos[0]} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-coal-2 text-xs text-muted">Sem foto</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{vehicleName(v)} <span className="text-muted">{v.version}</span></p>
                  <p className="mt-0.5 text-sm text-muted">{[yearLabel(v), formatKm(v.km)].filter(Boolean).join(' · ')}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${BADGE[v.status]}`}>{STATUS_LABEL[v.status]}</span>
                    <Pill on={v.visible}>{v.visible ? 'Visível' : 'Oculto'}</Pill>
                    <Pill on={v.featured}>Destaque</Pill>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <Actions v={v} first={i === 0} last={i === vehicles.length - 1} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getFinanceConfig, getVehicleFinance } from '@/lib/finance-store'
import { STATUS_LABEL, vehicleName, yearLabel } from '@/lib/vehicles'
import type { VehicleStatus } from '@/lib/types'
import { FinanceForm } from './finance-form'

export const dynamic = 'force-dynamic'

const BADGE: Record<VehicleStatus, string> = {
  disponivel: 'border-emerald-500/40 text-emerald-400',
  reservado: 'border-amber-500/40 text-amber-400',
  vendido: 'border-white/20 text-muted',
}

interface Row {
  brand: string
  model: string
  version: string | null
  year_manufacture: number | null
  year_model: number | null
  status: VehicleStatus
}

export default async function FinanceiroVeiculoPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>
  searchParams: Promise<{ ok?: string; erro?: string }>
}) {
  const { supabase } = await requireAdmin()
  const { vehicleId } = await params
  const { ok, erro } = await searchParams
  const [{ data }, config, existing] = await Promise.all([
    supabase.from('suv_vehicles').select('brand, model, version, year_manufacture, year_model, status').eq('id', vehicleId).maybeSingle(),
    getFinanceConfig(),
    getVehicleFinance(vehicleId),
  ])
  const row = data as Row | null
  if (!row && !existing.snapshot.name) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted">Veículo não encontrado.</p>
        <Link href="/painel/financeiro" className="mt-4 inline-block text-gold-light">← Financeiro</Link>
      </div>
    )
  }
  const snapshot = row
    ? {
        name: vehicleName({ brand: row.brand, model: row.model }),
        version: row.version ?? '',
        year: yearLabel({ yearManufacture: row.year_manufacture, yearModel: row.year_model }),
      }
    : existing.snapshot
  const initial = { ...existing, snapshot }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/painel/financeiro" className="text-sm text-muted hover:text-gold-light">← Financeiro</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-gold text-2xl">{snapshot.name} <span className="text-base">{snapshot.version}</span></h1>
        {row ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${BADGE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
        ) : (
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">Removido do site</span>
        )}
        {snapshot.year && <span className="text-sm text-muted">{snapshot.year}</span>}
      </div>
      {ok && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Financeiro salvo.</p>}
      {erro && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      <FinanceForm initial={initial} partners={config.partners} />
    </div>
  )
}

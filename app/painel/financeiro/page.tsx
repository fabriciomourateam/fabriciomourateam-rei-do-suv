import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { computeFinance, formatBRL, formatPct, monthLabel, monthOf, type FinanceResult, type VehicleFinance } from '@/lib/finance'
import { getFinanceConfig, listAllFinance } from '@/lib/finance-store'
import { STATUS_LABEL, vehicleName, yearLabel } from '@/lib/vehicles'
import type { VehicleStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface VRow {
  id: string
  brand: string
  model: string
  version: string | null
  year_manufacture: number | null
  year_model: number | null
  status: VehicleStatus
}

interface Item {
  id: string
  name: string
  version: string
  year: string
  status: VehicleStatus | null
  finance: VehicleFinance | null
  result: FinanceResult | null
}

const BADGE: Record<VehicleStatus, string> = {
  disponivel: 'border-emerald-500/40 text-emerald-400',
  reservado: 'border-amber-500/40 text-amber-400',
  vendido: 'border-white/20 text-muted',
}

const tone = (n: number | null) => (n == null ? '' : n >= 0 ? 'text-emerald-400' : 'text-red-400')
const money = (n: number | null | undefined) => (n == null ? '—' : formatBRL(n))

function StatusTag({ status }: { status: VehicleStatus | null }) {
  return status ? (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${BADGE[status]}`}>{STATUS_LABEL[status]}</span>
  ) : (
    <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">removido do site</span>
  )
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase } = await requireAdmin()
  const { mes } = await searchParams
  const [config, finances, { data }] = await Promise.all([
    getFinanceConfig(),
    listAllFinance(),
    supabase.from('suv_vehicles').select('id, brand, model, version, year_manufacture, year_model, status').order('sort_order', { ascending: true }),
  ])
  const vehicles = (data ?? []) as VRow[]
  const byId = new Map(finances.map((f) => [f.vehicleId, f]))

  const items: Item[] = vehicles.map((v) => {
    const finance = byId.get(v.id) ?? null
    return {
      id: v.id,
      name: vehicleName(v),
      version: v.version ?? '',
      year: yearLabel({ yearManufacture: v.year_manufacture, yearModel: v.year_model }),
      status: v.status,
      finance,
      result: finance ? computeFinance(finance, config.partners) : null,
    }
  })
  const known = new Set(vehicles.map((v) => v.id))
  for (const f of finances) {
    if (known.has(f.vehicleId)) continue
    items.push({ id: f.vehicleId, name: f.snapshot.name || 'Veículo', version: f.snapshot.version, year: f.snapshot.year, status: null, finance: f, result: computeFinance(f, config.partners) })
  }

  const months = [...new Set(items.map((i) => monthOf(i.finance?.sale.date ?? null)).filter((m): m is string => !!m))].sort().reverse()
  const period = mes && months.includes(mes) ? mes : ''
  const isSold = (i: Item) => i.result?.profit != null
  const inPeriod = (i: Item) => isSold(i) && (!period || monthOf(i.finance?.sale.date ?? null) === period)

  const sold = items.filter(inPeriod)
  const profitTotal = sold.reduce((a, i) => a + (i.result?.profit ?? 0), 0)
  const margins = sold.map((i) => i.result?.marginPct).filter((m): m is number => m != null)
  const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : null
  const stockCapital = items.filter((i) => !isSold(i)).reduce((a, i) => a + (i.result?.totalInvested ?? 0), 0)
  const partnerTotals = config.partners.map((p) => {
    let share = 0
    let settlement = 0
    for (const i of sold) {
      const pr = i.result?.perPartner.find((x) => x.partnerId === p.id)
      if (pr) {
        share += pr.share
        settlement += pr.settlement
      }
    }
    return { ...p, share, settlement }
  })

  const kpi = 'rounded-xl border border-gold bg-coal p-4'
  const kpiLabel = 'text-[11px] uppercase tracking-wider text-muted'
  const num = 'text-right tabular-nums'

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-gold text-2xl">Financeiro</h1>
        <Link href="/painel/financeiro/config" className="btn-ghost rounded-xl px-4 py-2 text-sm">Sócios e divisão</Link>
      </div>

      <form method="get" className="mt-6 flex items-end gap-2">
        <div>
          <label className="label" htmlFor="mes">Período (mês da venda)</label>
          <select id="mes" name="mes" defaultValue={period} className="field">
            <option value="">Todos</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <button className="btn-ghost rounded-lg px-4 py-2.5 text-sm">Filtrar</button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={kpi}><p className={kpiLabel}>Lucro total</p><p className={`mt-2 text-xl font-semibold tabular-nums ${tone(profitTotal)}`}>{formatBRL(profitTotal)}</p></div>
        <div className={kpi}><p className={kpiLabel}>Margem média</p><p className={`mt-2 text-xl font-semibold tabular-nums ${tone(avgMargin)}`}>{formatPct(avgMargin)}</p></div>
        <div className={kpi}><p className={kpiLabel}>Vendidos</p><p className="mt-2 text-xl font-semibold tabular-nums">{sold.length}</p></div>
        <div className={kpi}><p className={kpiLabel}>Capital em estoque</p><p className="mt-2 text-xl font-semibold tabular-nums">{formatBRL(stockCapital)}</p></div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {partnerTotals.map((p) => (
          <div key={p.id} className={kpi}>
            <p className={kpiLabel}>Lucro de {p.name} · {p.pct.toLocaleString('pt-BR')}%</p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${tone(p.share)}`}>{formatBRL(p.share)}</p>
            <p className={`mt-1 text-sm tabular-nums ${p.settlement > 0 ? 'text-emerald-400' : p.settlement < 0 ? 'text-red-400' : 'text-muted'}`}>
              {p.settlement >= 0 ? `A receber: ${formatBRL(p.settlement)}` : `A pagar: ${formatBRL(-p.settlement)}`}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-muted">Nenhum veículo cadastrado ainda.</p>
      ) : (
        <>
          {/* Desktop */}
          <div className="mt-8 hidden overflow-x-auto rounded-xl border border-gold bg-coal md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 text-left font-normal">Carro</th>
                  <th className="px-3 py-3 text-left font-normal">Status</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Compra</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Custos</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Investido</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Venda</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Lucro</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Margem</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3"><span className="font-medium">{i.name}</span> <span className="text-muted">{[i.version, i.year].filter(Boolean).join(' · ')}</span></td>
                    <td className="px-3 py-3"><StatusTag status={i.status} /></td>
                    <td className={`px-3 py-3 ${num}`}>{money(i.finance?.purchase.amountCents)}</td>
                    <td className={`px-3 py-3 ${num}`}>{i.result ? money(i.result.costsTotal) : '—'}</td>
                    <td className={`px-3 py-3 ${num}`}>{i.result ? money(i.result.totalInvested) : '—'}</td>
                    <td className={`px-3 py-3 ${num}`}>{money(i.result?.sale)}</td>
                    <td className={`px-3 py-3 ${num} ${tone(i.result?.profit ?? null)}`}>{money(i.result?.profit)}</td>
                    <td className={`px-3 py-3 ${num} ${tone(i.result?.marginPct ?? null)}`}>{formatPct(i.result?.marginPct ?? null)}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/painel/financeiro/${i.id}`} className="text-gold-light hover:underline">{i.finance ? 'Abrir' : 'Preencher'}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="mt-8 space-y-3 md:hidden">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl border border-gold bg-coal p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.name} <span className="text-muted">{i.version}</span></p>
                    <p className="text-xs text-muted">{i.year}</p>
                  </div>
                  <StatusTag status={i.status} />
                </div>
                {i.result ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-muted">Compra</dt><dd className={num}>{money(i.finance?.purchase.amountCents)}</dd>
                    <dt className="text-muted">Custos</dt><dd className={num}>{money(i.result.costsTotal)}</dd>
                    <dt className="text-muted">Investido</dt><dd className={num}>{money(i.result.totalInvested)}</dd>
                    <dt className="text-muted">Venda</dt><dd className={num}>{money(i.result.sale)}</dd>
                    <dt className="text-muted">Lucro</dt><dd className={`${num} ${tone(i.result.profit)}`}>{money(i.result.profit)}</dd>
                    <dt className="text-muted">Margem</dt><dd className={`${num} ${tone(i.result.marginPct)}`}>{formatPct(i.result.marginPct)}</dd>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted">—</p>
                )}
                <Link href={`/painel/financeiro/${i.id}`} className="btn-ghost mt-3 inline-block rounded-lg px-4 py-2 text-xs">{i.finance ? 'Abrir' : 'Preencher'}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { computeFinance, formatBRL, formatPct, monthLabel, monthOf } from '@/lib/finance'
import { getFinanceConfig, listAllFinance } from '@/lib/finance-store'

export const dynamic = 'force-dynamic'

/** 'AAAA-MM' do mês atual no fuso de São Paulo. */
function currentMonth(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
  return `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}`
}

type Row = { id: string; status: string; brand: string; model: string; version: string | null; year_model: number | null }

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export default async function PainelHome() {
  const { supabase } = await requireAdmin()
  const since = daysAgo(30)
  const [{ data: vehicles }, { data: clicks }, finances, financeConfig] = await Promise.all([
    supabase.from('suv_vehicles').select('id,status,brand,model,version,year_model'),
    supabase.from('suv_clicks').select('vehicle_id').gte('created_at', since).limit(50000),
    listAllFinance(),
    getFinanceConfig(),
  ])

  // Lucro do mês: carros com valor de venda e data de venda no mês atual
  const month = currentMonth()
  const soldThisMonth = finances
    .filter((f) => f.sale.amountCents != null && monthOf(f.sale.date) === month)
    .map((f) => computeFinance(f, financeConfig.partners))
  const monthProfit = soldThisMonth.reduce((a, r) => a + (r.profit ?? 0), 0)
  const monthSales = soldThisMonth.reduce((a, r) => a + (r.sale ?? 0), 0)
  const monthMargin = monthSales ? (monthProfit / monthSales) * 100 : null
  const monthShares = financeConfig.partners.map((p, i) => ({
    name: p.name,
    share: soldThisMonth.reduce((a, r) => a + (r.perPartner[i]?.share ?? 0), 0),
  }))
  const list = (vehicles ?? []) as Row[]
  const clickRows = (clicks ?? []) as { vehicle_id: string | null }[]
  const count = (s: string) => list.filter((v) => v.status === s).length

  const perVehicle = new Map<string, number>()
  for (const c of clickRows) if (c.vehicle_id) perVehicle.set(c.vehicle_id, (perVehicle.get(c.vehicle_id) ?? 0) + 1)
  const ranking = list
    .map((v) => ({ v, n: perVehicle.get(v.id) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10)

  const cards = [
    { label: 'Disponíveis', value: count('disponivel') },
    { label: 'Reservados', value: count('reservado') },
    { label: 'Vendidos', value: count('vendido') },
    { label: 'Cliques no WhatsApp (30 dias)', value: clickRows.length },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-gold text-2xl">Visão geral</h1>
        <Link href="/painel/veiculos/novo" className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold uppercase tracking-widest">
          Cadastrar veículo
        </Link>
      </div>

      <Link
        href={`/painel/financeiro?mes=${month}`}
        className="mt-8 block rounded-xl border border-gold bg-coal p-5 transition hover:border-[var(--gold)]/60 md:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Lucro do mês · {monthLabel(month)}</p>
            <p className={`font-display mt-2 text-4xl tabular-nums ${monthProfit < 0 ? 'text-red-400' : 'text-gold'}`}>{formatBRL(monthProfit)}</p>
            <p className="mt-2 text-sm text-muted">
              {soldThisMonth.length} {soldThisMonth.length === 1 ? 'carro vendido' : 'carros vendidos'} · vendas {formatBRL(monthSales)} · margem {formatPct(monthMargin)}
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2">
            {monthShares.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-6 rounded-lg border border-white/10 px-4 py-2.5">
                <span className="text-sm text-text/80">{p.name}</span>
                <span className="font-medium tabular-nums">{formatBRL(p.share)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">Conta só os carros com valor e data de venda preenchidos no Financeiro. Toque para ver os detalhes.</p>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gold bg-coal p-5">
            <p className="font-display text-gold text-4xl">{c.value}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-gold bg-coal p-5">
        <h2 className="label !mb-4">Mais procurados (30 dias)</h2>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted">Ainda sem cliques no período.</p>
        ) : (
          <ol className="divide-y divide-white/10">
            {ranking.map(({ v, n }, i) => (
              <li key={v.id} className="flex items-center gap-4 py-3">
                <span className="font-display text-gold w-6 text-lg">{i + 1}</span>
                <Link href={`/painel/veiculos/${v.id}`} className="min-w-0 flex-1 truncate hover:text-gold-light">
                  {[v.brand, v.model, v.version, v.year_model].filter(Boolean).join(' ')}
                </Link>
                <span className="text-sm text-muted">{n} {n === 1 ? 'clique' : 'cliques'}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

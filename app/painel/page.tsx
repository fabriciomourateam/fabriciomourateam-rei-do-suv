import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'

type Row = { id: string; status: string; brand: string; model: string; version: string | null; year_model: number | null }

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export default async function PainelHome() {
  const { supabase } = await requireAdmin()
  const since = daysAgo(30)
  const [{ data: vehicles }, { data: clicks }] = await Promise.all([
    supabase.from('suv_vehicles').select('id,status,brand,model,version,year_model'),
    supabase.from('suv_clicks').select('vehicle_id').gte('created_at', since).limit(50000),
  ])
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

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

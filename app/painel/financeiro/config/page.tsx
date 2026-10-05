import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getFinanceConfig } from '@/lib/finance-store'
import { saveConfig } from '../actions'

export const dynamic = 'force-dynamic'

export default async function FinanceiroConfigPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireAdmin()
  const { ok, erro } = await searchParams
  const { partners } = await getFinanceConfig()
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/painel/financeiro" className="text-sm text-muted hover:text-gold-light">← Financeiro</Link>
      <h1 className="font-display text-gold mb-6 mt-2 text-2xl">Sócios e divisão</h1>
      {ok && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Configuração salva.</p>}
      {erro && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      <form action={saveConfig} className="space-y-5 pb-24 md:pb-6">
        {partners.map((p, i) => (
          <section key={p.id} className="rounded-xl border border-gold bg-coal p-5">
            <h2 className="font-display text-gold mb-4 text-sm">Sócio {i + 1}</h2>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div>
                <label className="label" htmlFor={`name${i + 1}`}>Nome</label>
                <input id={`name${i + 1}`} name={`name${i + 1}`} required defaultValue={p.name} className="field" />
              </div>
              <div>
                <label className="label" htmlFor={`pct${i + 1}`}>Participação (%)</label>
                <input id={`pct${i + 1}`} name={`pct${i + 1}`} inputMode="decimal" required defaultValue={String(p.pct).replace('.', ',')} className="field text-right tabular-nums" />
              </div>
            </div>
          </section>
        ))}
        <p className="text-xs text-muted">Os percentuais precisam somar 100%. A divisão vale para o lucro de todos os carros.</p>
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gold bg-coal/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <button type="submit" className="btn-gold w-full rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-widest md:w-auto">Salvar</button>
        </div>
      </form>
    </div>
  )
}

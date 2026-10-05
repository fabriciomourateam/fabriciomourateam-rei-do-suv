'use client'
import { useMemo, useState } from 'react'
import {
  COST_CATEGORIES,
  COST_LABEL,
  COST_SHORT,
  computeFinance,
  formatAmountInput,
  formatBRL,
  formatPct,
  parseBRL,
  SALE_DEDUCTED,
  SPLIT_EQUAL,
  type CostCategory,
  type Partner,
  type VehicleFinance,
} from '@/lib/finance'
import { saveFinance } from '../actions'
import { SubmitButton } from '@/components/painel/submit-button'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gold bg-coal p-5">
      <h2 className="font-display text-gold mb-4 text-sm">{title}</h2>
      {children}
    </section>
  )
}

/** Campo de dinheiro: digita livre, formata ao sair do campo. */
function MoneyInput({ cents, onChange, id, placeholder = '0,00' }: {
  cents: number | null; onChange: (c: number | null) => void; id?: string; placeholder?: string
}) {
  const [text, setText] = useState(formatAmountInput(cents))
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">R$</span>
      <input id={id} inputMode="decimal" autoComplete="off" placeholder={placeholder} value={text}
        onChange={(e) => { setText(e.target.value); onChange(parseBRL(e.target.value)) }}
        onBlur={() => setText(formatAmountInput(parseBRL(text)))}
        className="field !pl-9 text-right tabular-nums" />
    </div>
  )
}

function PartnerSelect({ value, onChange, partners, id, saleOption }: {
  value: string | null; onChange: (v: string | null) => void; partners: Partner[]; id?: string; saleOption?: boolean
}) {
  return (
    <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className="field">
      <option value="">—</option>
      {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      {partners.length > 1 && <option value={SPLIT_EQUAL}>Metade cada</option>}
      {saleOption && <option value={SALE_DEDUCTED}>Descontado da venda</option>}
    </select>
  )
}

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function FinanceForm({ initial, partners }: { initial: VehicleFinance; partners: Partner[] }) {
  const [f, setF] = useState<VehicleFinance>(initial)
  const r = useMemo(() => computeFinance(f, partners), [f, partners])

  const setPurchase = (p: Partial<VehicleFinance['purchase']>) => setF((s) => ({ ...s, purchase: { ...s.purchase, ...p } }))
  const setSale = (p: Partial<VehicleFinance['sale']>) => setF((s) => ({ ...s, sale: { ...s.sale, ...p } }))
  const setCost = (id: string, p: Partial<VehicleFinance['costs'][number]>) =>
    setF((s) => ({ ...s, costs: s.costs.map((c) => (c.id === id ? { ...c, ...p } : c)) }))
  const addCost = (category: CostCategory) =>
    setF((s) => ({ ...s, costs: [...s.costs, { id: newId(), category, description: '', amountCents: 0, date: null, paidBy: null }] }))
  const removeCost = (id: string) => setF((s) => ({ ...s, costs: s.costs.filter((c) => c.id !== id) }))

  const profitCls = r.profit == null ? 'text-text' : r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
  const row = 'flex items-baseline justify-between gap-3 py-1.5 text-sm'

  return (
    <form action={saveFinance} className="grid items-start gap-5 pb-28 md:pb-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <input type="hidden" name="vehicleId" value={f.vehicleId} />
      <input type="hidden" name="payload" value={JSON.stringify(f)} />

      <div className="space-y-5">
        <Section title="Compra">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pv">Valor da compra</label>
              <MoneyInput id="pv" cents={f.purchase.amountCents} onChange={(c) => setPurchase({ amountCents: c })} />
            </div>
            <div>
              <label className="label" htmlFor="pd">Data</label>
              <input id="pd" type="date" value={f.purchase.date ?? ''} onChange={(e) => setPurchase({ date: e.target.value || null })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="pp">Pago por</label>
              <PartnerSelect id="pp" partners={partners} value={f.purchase.paidBy} onChange={(v) => setPurchase({ paidBy: v })} />
            </div>
            <div>
              <label className="label" htmlFor="pn">Observação</label>
              <input id="pn" value={f.purchase.note} onChange={(e) => setPurchase({ note: e.target.value })} className="field" />
            </div>
          </div>
        </Section>

        <Section title="Custos">
          {f.costs.length === 0 && <p className="mb-4 text-sm text-muted">Nenhum custo lançado. Toque numa categoria para adicionar.</p>}
          <ul className="space-y-3">
            {f.costs.map((c) => (
              <li key={c.id} className="rounded-lg border border-white/10 bg-coal-2/40 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor={`cat-${c.id}`}>Categoria</label>
                    <select id={`cat-${c.id}`} value={c.category} onChange={(e) => setCost(c.id, { category: e.target.value as CostCategory })} className="field">
                      {COST_CATEGORIES.map((k) => <option key={k} value={k}>{COST_LABEL[k]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor={`desc-${c.id}`}>Descrição</label>
                    <input id={`desc-${c.id}`} value={c.description} onChange={(e) => setCost(c.id, { description: e.target.value })} placeholder="Ex.: troca de pastilhas" className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor={`val-${c.id}`}>Valor</label>
                    <MoneyInput id={`val-${c.id}`} cents={c.amountCents || null} onChange={(v) => setCost(c.id, { amountCents: v ?? 0 })} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`dt-${c.id}`}>Data</label>
                    <input id={`dt-${c.id}`} type="date" value={c.date ?? ''} onChange={(e) => setCost(c.id, { date: e.target.value || null })} className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor={`by-${c.id}`}>Pago por</label>
                    <PartnerSelect id={`by-${c.id}`} partners={partners} value={c.paidBy} onChange={(v) => setCost(c.id, { paidBy: v })} saleOption />
                  </div>
                  <div className="flex items-end justify-end">
                    <button type="button" onClick={() => removeCost(c.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-red-300 hover:border-red-400/50">Remover</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {COST_CATEGORIES.map((k) => (
              <button type="button" key={k} onClick={() => addCost(k)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted transition hover:border-gold hover:text-gold-light">
                + {COST_SHORT[k]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => addCost('outros')} className="btn-ghost mt-4 rounded-lg px-4 py-2 text-sm">Adicionar custo</button>

          {r.costsTotal > 0 && (
            <div className="mt-5 border-t border-white/10 pt-3">
              {COST_CATEGORIES.filter((k) => r.costsByCategory[k] > 0).map((k) => (
                <div key={k} className={row}>
                  <span className="text-muted">{COST_SHORT[k]}</span>
                  <span className="tabular-nums">{formatBRL(r.costsByCategory[k])}</span>
                </div>
              ))}
              <div className={`${row} border-t border-white/10 font-medium`}>
                <span>Total de custos</span>
                <span className="tabular-nums">{formatBRL(r.costsTotal)}</span>
              </div>
            </div>
          )}
        </Section>

        <Section title="Venda">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sv">Valor da venda</label>
              <MoneyInput id="sv" cents={f.sale.amountCents} onChange={(c) => setSale({ amountCents: c })} />
            </div>
            <div>
              <label className="label" htmlFor="sd">Data da venda</label>
              <input id="sd" type="date" value={f.sale.date ?? ''} onChange={(e) => setSale({ date: e.target.value || null })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="sr">Recebido por</label>
              <PartnerSelect id="sr" partners={partners} value={f.sale.receivedBy} onChange={(v) => setSale({ receivedBy: v })} />
            </div>
            <div>
              <label className="label" htmlFor="sn">Observação</label>
              <input id="sn" value={f.sale.note} onChange={(e) => setSale({ note: e.target.value })} className="field" />
            </div>
          </div>
          {r.deductedFromSale > 0 && r.sale != null && (
            <div className="mt-4 space-y-1 rounded-lg border border-white/10 p-3 text-sm">
              <div className={row}><span className="text-muted">Valor da venda</span><span className="tabular-nums">{formatBRL(r.sale)}</span></div>
              <div className={row}><span className="text-muted">Descontado da venda (custos)</span><span className="tabular-nums">− {formatBRL(r.deductedFromSale)}</span></div>
              <div className={`${row} font-medium`}><span>Valor líquido recebido</span><span className="tabular-nums">{formatBRL(r.saleNet ?? 0)}</span></div>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            Lucro = venda − compra − todos os custos (Auto Avaliar, transporte, manutenção…). A divisão entre os sócios é feita sobre esse lucro.
            Se a Auto Avaliar ou outra taxa foi tirada direto do valor da venda, cadastre como custo com &quot;Pago por: Descontado da venda&quot;.
          </p>
        </Section>
      </div>

      <aside className="rounded-xl border border-gold bg-coal p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-gold mb-3 text-sm">Resumo</h2>
        <div className={row}><span className="text-muted">Investido</span><span className="tabular-nums">{formatBRL(r.totalInvested)}</span></div>
        <div className={row}><span className="text-muted">Venda</span><span className="tabular-nums">{r.sale == null ? '—' : formatBRL(r.sale)}</span></div>
        <div className={`${row} border-t border-white/10 text-base`}>
          <span className="text-muted">Lucro</span>
          <span className={`font-semibold tabular-nums ${profitCls}`}>{r.profit == null ? '—' : formatBRL(r.profit)}</span>
        </div>
        <div className={row}><span className="text-muted">Margem</span><span className={`tabular-nums ${profitCls}`}>{formatPct(r.marginPct)}</span></div>
        <div className={row}><span className="text-muted">ROI</span><span className={`tabular-nums ${profitCls}`}>{formatPct(r.roiPct)}</span></div>

        {r.perPartner.map((p) => (
          <div key={p.partnerId} className="mt-4 border-t border-white/10 pt-3">
            <p className="text-sm font-medium">{p.name} <span className="text-muted">· {p.pct.toLocaleString('pt-BR')}%</span></p>
            <div className={row}><span className="text-muted">Parte do lucro</span><span className="tabular-nums">{r.profit == null ? '—' : formatBRL(p.share)}</span></div>
            <div className={row}><span className="text-muted">Pagou</span><span className="tabular-nums">{formatBRL(p.paid)}</span></div>
            <div className={row}><span className="text-muted">Recebeu</span><span className="tabular-nums">{formatBRL(p.received)}</span></div>
            {r.profit != null && (
              <p className={`mt-1 text-sm font-medium ${p.settlement > 0 ? 'text-emerald-400' : p.settlement < 0 ? 'text-red-400' : 'text-muted'}`}>
                {p.settlement > 0 ? `${p.name} recebe ${formatBRL(p.settlement)}` : p.settlement < 0 ? `${p.name} paga ${formatBRL(-p.settlement)}` : `${p.name}: quite`}
              </p>
            )}
          </div>
        ))}
        {r.profit == null && <p className="mt-4 text-xs text-muted">Informe o valor da venda para ver lucro e acerto entre os sócios.</p>}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gold bg-coal/95 p-3 backdrop-blur md:static md:col-span-full md:border-0 md:bg-transparent md:p-0">
        <SubmitButton className="btn-gold w-full rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-widest md:w-auto">Salvar financeiro</SubmitButton>
      </div>
    </form>
  )
}

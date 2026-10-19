'use client'
import { useState } from 'react'
import { MoneyInput } from '@/components/painel/money-input'
import { SubmitButton } from '@/components/painel/submit-button'
import { defaultDirection, ENTRY_LABEL, ENTRY_TYPES, type Direction, type EntryType } from '@/lib/personal'
import { addEntry } from './actions'

export function EntryForm({ today, mes, carNames }: { today: string; mes: string; carNames: string[] }) {
  const [type, setType] = useState<EntryType>('pagamento')
  const [direction, setDirection] = useState<Direction>('saida')
  const [cents, setCents] = useState<number | null>(null)

  const pickType = (t: EntryType) => {
    setType(t)
    const d = defaultDirection(t)
    if (d) setDirection(d)
  }
  const dirBtn = (d: Direction, label: string, active: string) => (
    <button type="button" onClick={() => setDirection(d)} aria-pressed={direction === d}
      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm transition ${direction === d ? active : 'border-white/10 text-muted'}`}>
      {label}
    </button>
  )

  return (
    <form action={addEntry} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="mes" value={mes} />
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="amountCents" value={cents ?? 0} />
      <div>
        <label className="label" htmlFor="e-date">Data</label>
        <input id="e-date" name="date" type="date" defaultValue={today} required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="e-type">Tipo</label>
        <select id="e-type" name="type" value={type} onChange={(e) => pickType(e.target.value as EntryType)} className="field">
          {ENTRY_TYPES.map((t) => <option key={t} value={t}>{ENTRY_LABEL[t]}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <span className="label">Sentido</span>
        <div className="flex gap-2">
          {dirBtn('saida', 'Saída (saiu do meu bolso)', 'border-red-400/60 bg-red-500/10 text-red-300')}
          {dirBtn('entrada', 'Entrada (entrou pra mim)', 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300')}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="e-desc">Descrição</label>
        <input id="e-desc" name="description" required maxLength={300} placeholder="Ex.: pagamento da funilaria" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="e-val">Valor</label>
        <MoneyInput id="e-val" cents={cents} onChange={setCents} />
      </div>
      <div>
        <label className="label" htmlFor="e-car">Carro (opcional)</label>
        <input id="e-car" name="vehicleRef" list="meu-carros" maxLength={120} autoComplete="off" className="field" />
        <datalist id="meu-carros">{carNames.map((n) => <option key={n} value={n} />)}</datalist>
      </div>
      <div>
        <label className="label" htmlFor="e-note">Observação</label>
        <input id="e-note" name="note" maxLength={1000} className="field" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-gold w-full rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest sm:w-auto" pendingText="Lançando…">
          Lançar movimentação
        </SubmitButton>
        {!cents && <span className="ml-3 text-xs text-muted">Informe um valor maior que zero.</span>}
      </div>
    </form>
  )
}

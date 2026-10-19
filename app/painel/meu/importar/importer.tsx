'use client'
import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/painel/submit-button'
import { computeFinance, emptyVehicleFinance, formatBRL, type Partner } from '@/lib/finance'
import { buildImport, type ImportResult } from '@/lib/personal-import'
import { importar, removerDuplicados, type ImportState } from '../actions'

type Preview = { kind: 'error'; errors: string[] } | { kind: 'ok'; result: Extract<ImportResult, { ok: true }> }

export function Importer({ partners }: { partners: Partner[] }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [state, action] = useActionState<ImportState | null, FormData>(importar, null)
  const [cleanState, cleanAction] = useActionState<ImportState | null>(removerDuplicados, null)

  const run = () => {
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      setPreview({ kind: 'error', errors: ['JSON inválido: confira se colou o texto inteiro.'] })
      return
    }
    const r = buildImport(json, partners)
    setPreview(r.ok ? { kind: 'ok', result: r } : { kind: 'error', errors: r.errors })
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-xl border border-white/10 p-4 text-sm">
        <p className="text-muted">Importou mais de uma vez e ficou repetido? Este botão apaga as cópias (carros históricos com o mesmo nome e movimentações idênticas), mantendo uma de cada.</p>
        <form action={cleanAction} className="mt-3">
          <SubmitButton className="btn-ghost rounded-xl px-5 py-2.5 text-sm" pendingText="Limpando…">Remover duplicados</SubmitButton>
        </form>
        {cleanState && <p className={`mt-3 ${cleanState.ok ? 'text-emerald-300' : 'text-red-300'}`}>{cleanState.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="payload-text">JSON para importar</label>
        <textarea id="payload-text" value={text} onChange={(e) => { setText(e.target.value); setPreview(null) }}
          rows={12} spellCheck={false} placeholder='{ "movimentacoes": [], "carros": [] }' className="field font-mono text-xs" />
        <button type="button" onClick={run} disabled={!text.trim()} className="btn-ghost mt-3 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50">Pré-visualizar</button>
      </div>

      {preview?.kind === 'error' && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-medium">Não foi possível ler:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{preview.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {preview?.kind === 'ok' && (
        <div className="rounded-xl border border-gold bg-coal p-5">
          <h2 className="font-display text-gold text-sm">Resumo</h2>
          <p className="mt-2 text-sm">{preview.result.entries.length} movimentações · {preview.result.cars.length} carros</p>
          {preview.result.entries.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              Entradas {formatBRL(preview.result.entries.filter((e) => e.direction === 'entrada').reduce((a, e) => a + e.amountCents, 0))} · saídas{' '}
              {formatBRL(preview.result.entries.filter((e) => e.direction === 'saida').reduce((a, e) => a + e.amountCents, 0))}
            </p>
          )}
          {preview.result.cars.length > 0 && (
            <ul className="mt-4 space-y-3">
              {preview.result.cars.map((c, i) => {
                const f = { ...emptyVehicleFinance('tmp'), ...c.finance }
                const r = computeFinance(f, partners)
                return (
                  <li key={i} className="rounded-lg border border-white/10 p-3 text-sm">
                    <p className="font-medium">{f.snapshot.name} <span className="text-muted">{[f.snapshot.version, f.snapshot.year, c.placa].filter(Boolean).join(' · ')}</span></p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
                      <dt className="text-muted">Compra</dt><dd className="text-right">{formatBRL(r.purchase)}</dd>
                      <dt className="text-muted">Custos ({f.costs.length})</dt><dd className="text-right">{formatBRL(r.costsTotal)}</dd>
                      <dt className="text-muted">Venda</dt><dd className="text-right">{r.sale == null ? '— (em estoque)' : formatBRL(r.sale)}</dd>
                      {r.profit != null && (<><dt className="text-muted">Lucro dividido</dt><dd className="text-right">{formatBRL(r.profit)}</dd></>)}
                    </dl>
                  </li>
                )
              })}
            </ul>
          )}
          <form action={action} className="mt-5">
            <input type="hidden" name="payload" value={text} />
            <SubmitButton className="btn-gold rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest" pendingText="Importando…">Importar</SubmitButton>
          </form>
        </div>
      )}

      {state && (
        <div className={`rounded-xl border p-4 text-sm ${state.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          <p>{state.message}</p>
          {state.errors && <ul className="mt-2 list-disc space-y-1 pl-5">{state.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
        </div>
      )}
    </div>
  )
}

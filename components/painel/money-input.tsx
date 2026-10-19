'use client'
import { useState } from 'react'
import { formatAmountInput, parseBRL } from '@/lib/finance'

/** Campo de dinheiro: digita livre, formata ao sair do campo. */
export function MoneyInput({ cents, onChange, id, placeholder = '0,00' }: {
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

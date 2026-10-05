'use client'
import { useFormStatus } from 'react-dom'

/** Botão de salvar que trava e mostra "Salvando…" enquanto o servidor grava (evita clique duplo). */
export function SubmitButton({ children, className = '', pendingText = 'Salvando…' }: {
  children: React.ReactNode; className?: string; pendingText?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? pendingText : children}
    </button>
  )
}

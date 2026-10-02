'use client'
import { deleteVehicle } from './actions'

export function DeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteVehicle}
      onSubmit={(e) => {
        if (!confirm(`Excluir "${name}" e todas as fotos? Isso não pode ser desfeito.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">Excluir</button>
    </form>
  )
}

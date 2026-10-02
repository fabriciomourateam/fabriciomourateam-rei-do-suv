import { requireAdmin } from '@/lib/auth'
import { VehicleForm } from '../vehicle-form'

export default async function NovoVeiculoPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await requireAdmin()
  const { erro } = await searchParams
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-gold mb-6 text-2xl">Novo veículo</h1>
      {erro && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      <VehicleForm />
    </div>
  )
}

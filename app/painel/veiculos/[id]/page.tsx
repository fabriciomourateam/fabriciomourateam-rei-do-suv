import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { rowToVehicle } from '@/lib/vehicles'
import type { VehicleRow } from '@/lib/types'
import { VehicleForm } from '../vehicle-form'

export default async function EditarVeiculoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ erro?: string }>
}) {
  const { supabase } = await requireAdmin()
  const { id } = await params
  const { erro } = await searchParams
  const { data } = await supabase.from('suv_vehicles').select('*, suv_photos(url, sort_order)').eq('id', id).maybeSingle()
  if (!data) notFound()
  const vehicle = rowToVehicle(data as VehicleRow)
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-gold mb-6 text-2xl">Editar veículo</h1>
      {erro && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      <VehicleForm vehicle={vehicle} />
    </div>
  )
}

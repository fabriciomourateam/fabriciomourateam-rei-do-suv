'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { toSlug } from '@/lib/slug'

const num = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().int().nonnegative().nullable(),
)
const str = z.string().trim().max(2000)

const schema = z.object({
  brand: str.min(1),
  model: str.min(1),
  version: str,
  engine: str,
  drivetrain: str,
  yearManufacture: num,
  yearModel: num,
  km: num,
  color: str,
  transmission: str,
  fuel: str,
  seats: num,
  headline: str,
  description: str,
  status: z.enum(['disponivel', 'reservado', 'vendido']),
})

function field(fd: FormData, k: string) {
  return String(fd.get(k) ?? '')
}

export async function saveVehicle(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = field(formData, 'id')
  const back = id ? `/painel/veiculos/${id}` : '/painel/veiculos/novo'

  const parsed = schema.safeParse({
    brand: field(formData, 'brand'),
    model: field(formData, 'model'),
    version: field(formData, 'version'),
    engine: field(formData, 'engine'),
    drivetrain: field(formData, 'drivetrain'),
    yearManufacture: field(formData, 'yearManufacture'),
    yearModel: field(formData, 'yearModel'),
    km: field(formData, 'km'),
    color: field(formData, 'color'),
    transmission: field(formData, 'transmission'),
    fuel: field(formData, 'fuel'),
    seats: field(formData, 'seats'),
    headline: field(formData, 'headline'),
    description: field(formData, 'description'),
    status: field(formData, 'status') || 'disponivel',
  })
  if (!parsed.success) redirect(`${back}?erro=${encodeURIComponent('Confira os campos: marca e modelo são obrigatórios e números devem ser válidos.')}`)
  const d = parsed.data

  const highlights = formData.getAll('highlights').map((h) => String(h).trim()).filter(Boolean)
  let photoUrls: string[] = []
  try {
    const raw: unknown = JSON.parse(field(formData, 'photoUrls') || '[]')
    if (Array.isArray(raw)) photoUrls = raw.filter((u): u is string => typeof u === 'string' && u.length > 0)
  } catch {
    photoUrls = []
  }

  const fields = {
    brand: d.brand,
    model: d.model,
    version: d.version,
    engine: d.engine,
    drivetrain: d.drivetrain,
    year_manufacture: d.yearManufacture,
    year_model: d.yearModel,
    km: d.km,
    color: d.color,
    transmission: d.transmission,
    fuel: d.fuel,
    seats: d.seats,
    highlights,
    headline: d.headline,
    description: d.description,
    status: d.status,
    visible: formData.get('visible') === 'on',
    featured: formData.get('featured') === 'on',
    updated_at: new Date().toISOString(),
  }

  let vehicleId = id
  if (id) {
    const { error } = await supabase.from('suv_vehicles').update(fields).eq('id', id)
    if (error) redirect(`${back}?erro=${encodeURIComponent(error.message)}`)
  } else {
    const slug =
      toSlug(`${d.brand} ${d.model} ${d.version} ${d.yearModel ?? ''}`) + '-' + Math.random().toString(36).slice(2, 6)
    const { data, error } = await supabase
      .from('suv_vehicles')
      .insert({ ...fields, slug, sort_order: -Math.floor(Date.now() / 1000) })
      .select('id')
      .single()
    if (error || !data) redirect(`${back}?erro=${encodeURIComponent(error?.message ?? 'Erro ao salvar')}`)
    vehicleId = (data as { id: string }).id
  }

  await supabase.from('suv_photos').delete().eq('vehicle_id', vehicleId)
  if (photoUrls.length) {
    const { error } = await supabase
      .from('suv_photos')
      .insert(photoUrls.map((url, i) => ({ vehicle_id: vehicleId, url, sort_order: i })))
    if (error) redirect(`${back}?erro=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/painel/veiculos')
}

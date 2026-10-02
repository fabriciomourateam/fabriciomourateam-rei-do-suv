'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'

function done() {
  revalidatePath('/painel/veiculos')
  revalidatePath('/', 'layout')
}

export async function setStatus(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['disponivel', 'reservado', 'vendido'].includes(status)) return
  await supabase.from('suv_vehicles').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  done()
}

export async function toggleField(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const field = String(formData.get('field') ?? '')
  const value = String(formData.get('value') ?? '') === 'true'
  if (!id || (field !== 'visible' && field !== 'featured')) return
  await supabase.from('suv_vehicles').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
  done()
}

/** Reordena: normaliza sort_order para 0..n-1 na ordem atual e troca com o vizinho. */
export async function moveVehicle(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const dir = String(formData.get('dir') ?? '')
  const { data } = await supabase
    .from('suv_vehicles')
    .select('id')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id)
  const i = ids.indexOf(id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
  await Promise.all(ids.map((vid, idx) => supabase.from('suv_vehicles').update({ sort_order: idx }).eq('id', vid)))
  done()
}

export async function deleteVehicle(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('suv_vehicles').delete().eq('id', id)
  done()
}

'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'

function s(fd: FormData, k: string) {
  return String(fd.get(k) ?? '').trim()
}

export async function saveConfig(formData: FormData) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('suv_config').upsert({
    id: 1,
    whatsapp: s(formData, 'whatsapp').replace(/\D/g, ''),
    instagram: s(formData, 'instagram'),
    tiktok: s(formData, 'tiktok'),
    city: s(formData, 'city'),
    address_note: s(formData, 'addressNote'),
    hours: s(formData, 'hours'),
  })
  if (error) redirect(`/painel/config?erro=${encodeURIComponent(error.message)}`)
  revalidatePath('/', 'layout')
  redirect('/painel/config?ok=1')
}

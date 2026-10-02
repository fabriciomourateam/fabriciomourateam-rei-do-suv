'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const go = (q: string) => redirect(`/painel/usuarios?${q}`)
const erro = (m: string) => go(`erro=${encodeURIComponent(m)}`)

export async function addAdmin(formData: FormData) {
  await requireAdmin()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!/^\S+@\S+\.\S+$/.test(email)) erro('E-mail inválido.')
  if (password.length < 6) erro('A senha precisa ter pelo menos 6 caracteres.')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) erro('Chave de serviço não configurada.')

  const admin = createAdminClient()
  let userId: string | null = null
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.data.user) {
    userId = created.data.user.id
  } else {
    const msg = created.error?.message.toLowerCase() ?? ''
    if (!(msg.includes('already') || msg.includes('registered') || msg.includes('exists'))) {
      erro(created.error?.message ?? 'Não foi possível criar o usuário.')
    }
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const found = data?.users.find((u) => u.email?.toLowerCase() === email)
    if (!found) erro('Usuário já existe, mas não foi possível localizá-lo.')
    userId = found!.id
    const upd = await admin.auth.admin.updateUserById(userId, { password })
    if (upd.error) erro(upd.error.message)
  }

  const { error } = await admin.from('suv_admins').upsert({ user_id: userId, email }, { onConflict: 'user_id' })
  if (error) erro(error.message)
  revalidatePath('/painel/usuarios')
  go('ok=1')
}

export async function removeAdmin(formData: FormData) {
  const { supabase, user } = await requireAdmin()
  const id = String(formData.get('userId') ?? '')
  if (!id) return
  if (id === user.id) erro('Você não pode remover o seu próprio acesso.')
  const { error } = await supabase.from('suv_admins').delete().eq('user_id', id)
  if (error) erro(error.message)
  revalidatePath('/painel/usuarios')
  go('ok=1')
}

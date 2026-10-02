import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Garante usuário logado E presente em suv_admins. Usar no layout e em TODA server action. */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: admin } = await supabase.from('suv_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!admin) redirect('/login?erro=sem-acesso')
  return { supabase, user }
}

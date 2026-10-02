import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Garante usuário logado E presente em suv_admins. Usar no layout e em TODA server action.
 *
 * Depois da checagem, devolve um cliente com service role para ler/gravar: o painel
 * não depende das policies de RLS (que podem variar no banco), só desta verificação.
 */
export async function requireAdmin() {
  const userClient = await createClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : userClient
  const { data: admin } = await supabase.from('suv_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!admin) redirect('/login?erro=sem-acesso')
  return { supabase, user }
}

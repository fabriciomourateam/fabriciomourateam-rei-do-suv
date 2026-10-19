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

/**
 * Dono(s) da empresa: acesso à área privada "Meu financeiro".
 * Pode ser trocado pela variável OWNER_EMAILS (separados por vírgula).
 */
const OWNER_EMAILS = (process.env.OWNER_EMAILS || 'fabriciomouratreinador@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase())
}

/** Como requireAdmin, mas só deixa passar o dono. Outros admins voltam para o painel. */
export async function requireOwner() {
  const ctx = await requireAdmin()
  if (!isOwnerEmail(ctx.user.email)) redirect('/painel')
  return ctx
}

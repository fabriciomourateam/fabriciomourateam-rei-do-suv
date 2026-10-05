import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Lê um JSON do Storage sempre "fresco".
 *
 * O download direto do Supabase passa pelo CDN, que pode devolver a versão anterior
 * por alguns segundos depois de um upsert no mesmo caminho (salvou e "voltou o valor
 * antigo"). Um link assinado novo a cada leitura + parâmetro anti-cache + no-store
 * evita a cópia em cache. Retorna null se o arquivo não existe.
 */
export async function readFreshJson(bucket: string, path: string): Promise<unknown | null> {
  const storage = createAdminClient().storage.from(bucket)
  const { data, error } = await storage.createSignedUrl(path, 60)
  if (error || !data?.signedUrl) return null
  const sep = data.signedUrl.includes('?') ? '&' : '?'
  const res = await fetch(`${data.signedUrl}${sep}nocache=${Date.now()}-${Math.random().toString(36).slice(2)}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  if (!res.ok) return null
  return (await res.json()) as unknown
}

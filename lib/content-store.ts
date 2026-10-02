import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from './content'

export const CONTENT_BUCKET = 'suv-veiculos'
const CONTENT_PATH = 'site/content.json'

const canUseStorage = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

/** Cria o bucket público na primeira vez, se ainda não existir. */
export async function ensureBucket() {
  const admin = createAdminClient()
  const { data } = await admin.storage.getBucket(CONTENT_BUCKET)
  if (data) return null
  const { error } = await admin.storage.createBucket(CONTENT_BUCKET, { public: true })
  return error && !/exist/i.test(error.message) ? error.message : null
}

/** Lê os textos salvos (ou os padrões, se nada foi salvo / sem Supabase). */
export async function getSiteContent(): Promise<SiteContent> {
  if (!canUseStorage()) return DEFAULT_CONTENT
  try {
    const { data, error } = await createAdminClient().storage.from(CONTENT_BUCKET).download(CONTENT_PATH)
    if (error || !data) return DEFAULT_CONTENT
    return mergeContent(JSON.parse(await data.text()))
  } catch {
    return DEFAULT_CONTENT
  }
}

/** Salva os textos (chamar só depois de requireAdmin). Retorna mensagem de erro ou null. */
export async function saveSiteContent(content: SiteContent): Promise<string | null> {
  if (!canUseStorage()) return 'Supabase não configurado.'
  const bucketError = await ensureBucket()
  if (bucketError) return bucketError
  const body = new Blob([JSON.stringify(mergeContent(content))], { type: 'application/json' })
  const { error } = await createAdminClient()
    .storage.from(CONTENT_BUCKET)
    .upload(CONTENT_PATH, body, { upsert: true, contentType: 'application/json', cacheControl: '0' })
  return error ? error.message : null
}

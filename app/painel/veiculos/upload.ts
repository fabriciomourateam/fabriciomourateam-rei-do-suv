'use server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'suv-veiculos'

/**
 * Gera um link de envio assinado para uma foto. Usa a service role (só depois de
 * checar que é admin), então não depende das policies de storage, e cria o bucket
 * público na primeira vez, caso ainda não exista.
 */
export async function createPhotoUpload(ext: 'webp' | 'jpg') {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: bucket } = await admin.storage.getBucket(BUCKET)
  if (!bucket) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: true })
    if (error && !/exist/i.test(error.message)) return { error: error.message }
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Não foi possível preparar o envio.' }

  const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return { path: data.path, token: data.token, publicUrl }
}

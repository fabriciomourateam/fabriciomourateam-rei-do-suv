'use server'
import { requireAdmin } from '@/lib/auth'
import { CONTENT_BUCKET as BUCKET, ensureBucket } from '@/lib/content-store'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Gera um link de envio assinado para uma foto. Usa a service role (só depois de
 * checar que é admin), então não depende das policies de storage, e cria o bucket
 * público na primeira vez, caso ainda não exista.
 */
export async function createPhotoUpload(ext: 'webp' | 'jpg') {
  await requireAdmin()
  const admin = createAdminClient()

  const bucketError = await ensureBucket()
  if (bucketError) return { error: bucketError }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Não foi possível preparar o envio.' }

  const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return { path: data.path, token: data.token, publicUrl }
}

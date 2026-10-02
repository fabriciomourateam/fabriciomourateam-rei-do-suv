'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { DEFAULT_CONTENT, mergeContent } from '@/lib/content'
import { saveSiteContent } from '@/lib/content-store'

async function persist(content: unknown) {
  const error = await saveSiteContent(mergeContent(content))
  if (error) redirect(`/painel/textos?erro=${encodeURIComponent(error)}`)
  revalidatePath('/', 'layout')
  redirect('/painel/textos?ok=1')
}

export async function saveContent(formData: FormData) {
  await requireAdmin()
  let parsed: unknown
  try {
    parsed = JSON.parse(String(formData.get('content') ?? ''))
  } catch {
    redirect('/painel/textos?erro=' + encodeURIComponent('Conteúdo inválido. Tente de novo.'))
  }
  await persist(parsed)
}

export async function resetContent() {
  await requireAdmin()
  await persist(DEFAULT_CONTENT)
}

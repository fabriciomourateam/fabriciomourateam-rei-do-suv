import { requireAdmin } from '@/lib/auth'
import { getSiteContent } from '@/lib/content-store'
import { ContentEditor } from './content-editor'

export const dynamic = 'force-dynamic'

export default async function TextosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireAdmin()
  const { ok, erro } = await searchParams
  const content = await getSiteContent({ fresh: true })

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-gold mb-6 text-2xl">Textos do site</h1>
      {ok && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Textos salvos ✓</p>}
      {erro && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      <ContentEditor initial={content} />
    </div>
  )
}

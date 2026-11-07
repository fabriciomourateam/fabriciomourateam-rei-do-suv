import 'server-only'

/** Usado se o Banco Central não responder. Pode ser trocado pela variável CDI_ANUAL (ex.: "13.65"). */
const FALLBACK = Number(process.env.CDI_ANUAL) || 13.65

/**
 * CDI anualizado (% a.a., base 252) do Banco Central — série SGS 4389, último valor.
 * Cache de 1 dia; se falhar, devolve a estimativa.
 */
export async function getCdiAnnual(): Promise<{ pct: number; date: string | null; source: 'bcb' | 'estimativa' }> {
  try {
    const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json', {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { data: string; valor: string }[]
    const pct = Number(String(data?.[0]?.valor ?? '').replace(',', '.'))
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) throw new Error('valor inválido')
    const [d, m, y] = data[0].data.split('/')
    return { pct, date: `${y}-${m}-${d}`, source: 'bcb' }
  } catch {
    return { pct: FALLBACK, date: null, source: 'estimativa' }
  }
}

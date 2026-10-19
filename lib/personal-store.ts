import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { readFreshJson } from '@/lib/storage-json'
import { ensurePrivateBucket, PRIVATE_BUCKET } from '@/lib/finance-store'
import { ENTRY_TYPES, type Direction, type EntryType, type LedgerEntry, type PersonalLedger } from './personal'

const canUseStorage = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

/** Só ids de usuário seguros (uuid do Supabase Auth) viram caminho de arquivo. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/

function ledgerPath(userId: string): string | null {
  return SAFE_ID.test(userId) ? `pessoal/${userId}/ledger.json` : null
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function normalizeLedger(raw: unknown): PersonalLedger {
  if (!isRec(raw) || !Array.isArray(raw.entries)) return { entries: [], updatedAt: '' }
  const entries: LedgerEntry[] = []
  raw.entries.filter(isRec).forEach((e, i) => {
    const amount = typeof e.amountCents === 'number' && Number.isFinite(e.amountCents) ? Math.round(Math.abs(e.amountCents)) : 0
    const date = str(e.date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    const type: EntryType = ENTRY_TYPES.find((t) => t === e.type) ?? 'outro'
    const direction: Direction = e.direction === 'entrada' ? 'entrada' : 'saida'
    entries.push({
      id: str(e.id) || `e${i}`,
      date,
      type,
      description: str(e.description),
      amountCents: amount,
      direction,
      vehicleRef: str(e.vehicleRef),
      note: str(e.note),
    })
  })
  return { entries, updatedAt: str(raw.updatedAt) }
}

export async function getLedger(userId: string): Promise<PersonalLedger> {
  const path = ledgerPath(userId)
  if (!path || !canUseStorage()) return { entries: [], updatedAt: '' }
  try {
    return normalizeLedger(await readFreshJson(PRIVATE_BUCKET, path))
  } catch {
    return { entries: [], updatedAt: '' }
  }
}

/** Grava o caderno inteiro. Retorna mensagem de erro ou null. */
export async function saveLedger(userId: string, entries: LedgerEntry[]): Promise<string | null> {
  const path = ledgerPath(userId)
  if (!path) return 'Usuário inválido.'
  if (!canUseStorage()) return 'Supabase não configurado.'
  const bucketError = await ensurePrivateBucket()
  if (bucketError) return bucketError
  const value: PersonalLedger = { entries, updatedAt: new Date().toISOString() }
  const body = new Blob([JSON.stringify(value)], { type: 'application/json' })
  const { error } = await createAdminClient()
    .storage.from(PRIVATE_BUCKET)
    .upload(path, body, { upsert: true, contentType: 'application/json', cacheControl: '0' })
  return error ? error.message : null
}

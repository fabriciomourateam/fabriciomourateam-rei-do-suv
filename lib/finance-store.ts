import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { readFreshJson } from '@/lib/storage-json'
import {
  COST_CATEGORIES,
  DEFAULT_FINANCE_CONFIG,
  emptyVehicleFinance,
  type CostItem,
  type FinanceConfig,
  type VehicleFinance,
} from './finance'

/** Bucket PRIVADO: só acessado no servidor, depois de requireAdmin(). Nunca usar em páginas públicas. */
export const PRIVATE_BUCKET = 'suv-privado'
const CONFIG_PATH = 'financeiro/config.json'
const VEHICLES_DIR = 'financeiro/veiculos'

const canUseStorage = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

/** Cria o bucket privado se ainda não existir. Retorna mensagem de erro ou null. */
export async function ensurePrivateBucket(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.storage.getBucket(PRIVATE_BUCKET)
  if (data) return null
  const { error } = await admin.storage.createBucket(PRIVATE_BUCKET, { public: false })
  return error && !/exist/i.test(error.message) ? error.message : null
}

/** Tabela-espelho do financeiro (supabase/migrations/0002). Erros aqui nunca impedem o salvamento no bucket. */
const MIRROR_TABLE = 'suv_finance'
export const CONFIG_MIRROR_ID = '_config'

async function mirrorUpsert(rows: { vehicle_id: string; data: unknown }[]): Promise<void> {
  if (!canUseStorage() || rows.length === 0) return
  try {
    const now = new Date().toISOString()
    const { error } = await createAdminClient()
      .from(MIRROR_TABLE)
      .upsert(rows.map((r) => ({ ...r, updated_at: now })), { onConflict: 'vehicle_id' })
    if (error) console.warn('[financeiro] espelho não atualizado:', error.message)
  } catch (e) {
    console.warn('[financeiro] espelho não atualizado:', e instanceof Error ? e.message : e)
  }
}

async function mirrorDelete(vehicleId: string): Promise<void> {
  if (!canUseStorage()) return
  try {
    const { error } = await createAdminClient().from(MIRROR_TABLE).delete().eq('vehicle_id', vehicleId)
    if (error) console.warn('[financeiro] espelho não atualizado:', error.message)
  } catch (e) {
    console.warn('[financeiro] espelho não atualizado:', e instanceof Error ? e.message : e)
  }
}

async function readJson(path: string): Promise<unknown | null> {
  if (!canUseStorage()) return null
  try {
    return await readFreshJson(PRIVATE_BUCKET, path)
  } catch {
    return null
  }
}

async function writeJson(path: string, value: unknown): Promise<string | null> {
  if (!canUseStorage()) return 'Supabase não configurado.'
  const bucketError = await ensurePrivateBucket()
  if (bucketError) return bucketError
  const body = new Blob([JSON.stringify(value)], { type: 'application/json' })
  const { error } = await createAdminClient()
    .storage.from(PRIVATE_BUCKET)
    .upload(path, body, { upsert: true, contentType: 'application/json', cacheControl: '0' })
  return error ? error.message : null
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)
const centsOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)

function normalizeConfig(raw: unknown): FinanceConfig {
  if (!isRec(raw) || !Array.isArray(raw.partners)) return DEFAULT_FINANCE_CONFIG
  const partners = raw.partners.filter(isRec).map((p, i) => ({
    id: str(p.id) || `p${i + 1}`,
    name: str(p.name) || `Sócio ${i + 1}`,
    pct: typeof p.pct === 'number' ? p.pct : 50,
  }))
  return partners.length === 2 ? { partners } : DEFAULT_FINANCE_CONFIG
}

export function normalizeFinance(vehicleId: string, raw: unknown): VehicleFinance {
  const base = emptyVehicleFinance(vehicleId)
  if (!isRec(raw)) return base
  const snap = isRec(raw.snapshot) ? raw.snapshot : {}
  const pur = isRec(raw.purchase) ? raw.purchase : {}
  const sal = isRec(raw.sale) ? raw.sale : {}
  const costs: CostItem[] = Array.isArray(raw.costs)
    ? raw.costs.filter(isRec).map((c, i) => ({
        id: str(c.id) || `c${i}`,
        category: COST_CATEGORIES.find((k) => k === c.category) ?? 'outros',
        description: str(c.description),
        amountCents: centsOrNull(c.amountCents) ?? 0,
        date: strOrNull(c.date),
        paidBy: strOrNull(c.paidBy),
        shared: c.shared !== false,
      }))
    : []
  return {
    vehicleId,
    snapshot: { name: str(snap.name), version: str(snap.version), year: str(snap.year) },
    purchase: { amountCents: centsOrNull(pur.amountCents), date: strOrNull(pur.date), paidBy: strOrNull(pur.paidBy), note: str(pur.note) },
    costs,
    sale: { amountCents: centsOrNull(sal.amountCents), date: strOrNull(sal.date), receivedBy: strOrNull(sal.receivedBy), note: str(sal.note) },
    updatedAt: str(raw.updatedAt),
  }
}

export async function getFinanceConfig(): Promise<FinanceConfig> {
  return normalizeConfig(await readJson(CONFIG_PATH))
}

export async function saveFinanceConfig(config: FinanceConfig): Promise<string | null> {
  const error = await writeJson(CONFIG_PATH, config)
  if (!error) await mirrorUpsert([{ vehicle_id: CONFIG_MIRROR_ID, data: config }])
  return error
}

export async function getVehicleFinance(vehicleId: string): Promise<VehicleFinance> {
  return normalizeFinance(vehicleId, await readJson(`${VEHICLES_DIR}/${vehicleId}.json`))
}

export async function saveVehicleFinance(f: VehicleFinance): Promise<string | null> {
  const saved = { ...f, updatedAt: new Date().toISOString() }
  const error = await writeJson(`${VEHICLES_DIR}/${f.vehicleId}.json`, saved)
  if (!error) await mirrorUpsert([{ vehicle_id: f.vehicleId, data: saved }])
  return error
}

/** Todos os arquivos financeiros existentes (um por carro com dados). */
export async function listAllFinance(): Promise<VehicleFinance[]> {
  if (!canUseStorage()) return []
  try {
    const storage = createAdminClient().storage.from(PRIVATE_BUCKET)
    const { data, error } = await storage.list(VEHICLES_DIR, { limit: 1000 })
    if (error || !data) return []
    const ids = data.filter((f) => f.name.endsWith('.json')).map((f) => f.name.slice(0, -5))
    const all = await Promise.all(ids.map((id) => getVehicleFinance(id)))
    // Mantém a tabela-espelho em dia (inclui carros lançados antes dela existir).
    const config = await getFinanceConfig()
    await mirrorUpsert([
      { vehicle_id: CONFIG_MIRROR_ID, data: config },
      ...all.map((f) => ({ vehicle_id: f.vehicleId, data: f })),
    ])
    return all
  } catch {
    return []
  }
}

/** Apaga o arquivo financeiro de um carro. Retorna mensagem de erro ou null. */
export async function deleteVehicleFinance(vehicleId: string): Promise<string | null> {
  if (!canUseStorage()) return 'Supabase não configurado.'
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(vehicleId)) return 'Carro inválido.'
  const { error } = await createAdminClient().storage.from(PRIVATE_BUCKET).remove([`${VEHICLES_DIR}/${vehicleId}.json`])
  if (!error) await mirrorDelete(vehicleId)
  return error ? error.message : null
}

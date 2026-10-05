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

function normalizeFinance(vehicleId: string, raw: unknown): VehicleFinance {
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
  return writeJson(CONFIG_PATH, config)
}

export async function getVehicleFinance(vehicleId: string): Promise<VehicleFinance> {
  return normalizeFinance(vehicleId, await readJson(`${VEHICLES_DIR}/${vehicleId}.json`))
}

export async function saveVehicleFinance(f: VehicleFinance): Promise<string | null> {
  return writeJson(`${VEHICLES_DIR}/${f.vehicleId}.json`, { ...f, updatedAt: new Date().toISOString() })
}

/** Todos os arquivos financeiros existentes (um por carro com dados). */
export async function listAllFinance(): Promise<VehicleFinance[]> {
  if (!canUseStorage()) return []
  try {
    const storage = createAdminClient().storage.from(PRIVATE_BUCKET)
    const { data, error } = await storage.list(VEHICLES_DIR, { limit: 1000 })
    if (error || !data) return []
    const ids = data.filter((f) => f.name.endsWith('.json')).map((f) => f.name.slice(0, -5))
    return await Promise.all(ids.map((id) => getVehicleFinance(id)))
  } catch {
    return []
  }
}

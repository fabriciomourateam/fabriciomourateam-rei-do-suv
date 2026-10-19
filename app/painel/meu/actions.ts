'use server'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireOwner } from '@/lib/auth'
import { getFinanceConfig } from '@/lib/finance-store'
import { buildImport, carKey, entryKey, historicalId } from '@/lib/personal-import'
import { getLedger, getOwnerCars, saveLedger, saveOwnerCars } from '@/lib/personal-store'
import { ENTRY_TYPES, type EntryType, type LedgerEntry } from '@/lib/personal'

const MES = /^\d{4}-\d{2}$/

const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(ENTRY_TYPES as [EntryType, ...EntryType[]]),
  direction: z.enum(['entrada', 'saida']),
  description: z.string().trim().min(1).max(300),
  amountCents: z.number().int().min(1).max(100_000_000_000),
  vehicleRef: z.string().trim().max(120),
  note: z.string().trim().max(1000),
})

function back(mes: string, q: string): never {
  const params = new URLSearchParams()
  if (MES.test(mes)) params.set('mes', mes)
  const [k, v] = q.split('=')
  params.set(k, v ?? '1')
  redirect(`/painel/meu?${params.toString()}`)
}

export async function addEntry(formData: FormData) {
  const { user } = await requireOwner()
  const mes = String(formData.get('mes') ?? '')
  const parsed = entrySchema.safeParse({
    date: String(formData.get('date') ?? ''),
    type: String(formData.get('type') ?? ''),
    direction: String(formData.get('direction') ?? ''),
    description: String(formData.get('description') ?? ''),
    amountCents: Number(formData.get('amountCents')),
    vehicleRef: String(formData.get('vehicleRef') ?? ''),
    note: String(formData.get('note') ?? ''),
  })
  if (!parsed.success) back(mes, `erro=${encodeURIComponent('Confira data, descrição e valor.')}`)
  const ledger = await getLedger(user.id)
  const entry: LedgerEntry = { id: randomUUID(), ...parsed.data }
  const error = await saveLedger(user.id, [...ledger.entries, entry])
  if (error) back(mes, `erro=${encodeURIComponent(error)}`)
  revalidatePath('/painel/meu')
  back(mes, 'ok=1')
}

export async function deleteEntry(formData: FormData) {
  const { user } = await requireOwner()
  const mes = String(formData.get('mes') ?? '')
  const id = String(formData.get('id') ?? '')
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) back(mes, `erro=${encodeURIComponent('Movimentação inválida.')}`)
  const ledger = await getLedger(user.id)
  const error = await saveLedger(user.id, ledger.entries.filter((e) => e.id !== id))
  if (error) back(mes, `erro=${encodeURIComponent(error)}`)
  revalidatePath('/painel/meu')
  back(mes, 'ok=2')
}

export interface ImportState {
  ok: boolean
  message: string
  errors?: string[]
}

/**
 * Importação que não duplica: carro histórico com o mesmo nome é ATUALIZADO (mesmo registro);
 * movimentação idêntica (data, tipo, sentido, valor, descrição) já existente é ignorada.
 */
export async function importar(_prev: ImportState | null, formData: FormData): Promise<ImportState> {
  const { user } = await requireOwner()
  const raw = String(formData.get('payload') ?? '')
  if (raw.length > 900_000) return { ok: false, message: 'Arquivo grande demais.' }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'JSON inválido.' }
  }
  const config = await getFinanceConfig()
  const plan = buildImport(json, config.partners)
  if (!plan.ok) return { ok: false, message: 'Confira os dados.', errors: plan.errors }

  const cars = await getOwnerCars(user.id)
  const taken = new Set(cars.map((f) => f.vehicleId))
  let created = 0
  let updated = 0
  const now = new Date().toISOString()
  for (const car of plan.cars) {
    const key = carKey(car.finance.snapshot.name)
    const i = cars.findIndex((f) => carKey(f.snapshot.name) === key)
    if (i >= 0) {
      cars[i] = { ...car.finance, vehicleId: cars[i].vehicleId, updatedAt: now }
      updated++
    } else {
      let id = historicalId(car.finance.snapshot.name)
      while (taken.has(id)) id = historicalId(car.finance.snapshot.name)
      taken.add(id)
      cars.push({ ...car.finance, vehicleId: id, updatedAt: now })
      created++
    }
  }
  if (plan.cars.length) {
    const error = await saveOwnerCars(user.id, cars)
    if (error) return { ok: false, message: `Erro ao salvar os carros: ${error}` }
  }
  let addedCount = 0
  if (plan.entries.length) {
    const ledger = await getLedger(user.id)
    const seen = new Set(ledger.entries.map(entryKey))
    const added: LedgerEntry[] = []
    for (const e of plan.entries) {
      const k = entryKey(e)
      if (seen.has(k)) continue
      seen.add(k)
      added.push({ id: randomUUID(), ...e })
    }
    addedCount = added.length
    if (added.length) {
      const error = await saveLedger(user.id, [...ledger.entries, ...added])
      if (error) return { ok: false, message: `Erro ao salvar as movimentações: ${error}` }
    }
  }
  revalidatePath('/painel/meu')
  const skipped = plan.entries.length - addedCount
  return {
    ok: true,
    message: `Pronto: ${created} carros novos, ${updated} atualizados; ${addedCount} movimentações novas${skipped ? ` (${skipped} já existiam, ignoradas)` : ''}.`,
  }
}

/** Remove cópias no Meu financeiro: carros com o mesmo nome (fica o mais recente) e movimentações idênticas. */
export async function removerDuplicados(): Promise<ImportState> {
  const { user } = await requireOwner()
  const cars = await getOwnerCars(user.id)
  const keep = new Set<string>()
  const uniqueCars = [...cars]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((f) => {
      const k = carKey(f.snapshot.name)
      if (keep.has(k)) return false
      keep.add(k)
      return true
    })
  const carsRemoved = cars.length - uniqueCars.length
  if (carsRemoved) {
    const error = await saveOwnerCars(user.id, uniqueCars)
    if (error) return { ok: false, message: `Erro ao salvar os carros: ${error}` }
  }
  const ledger = await getLedger(user.id)
  const seen = new Set<string>()
  const unique = ledger.entries.filter((e) => {
    const k = entryKey(e)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const entriesRemoved = ledger.entries.length - unique.length
  if (entriesRemoved) {
    const error = await saveLedger(user.id, unique)
    if (error) return { ok: false, message: `Erro ao salvar as movimentações: ${error}` }
  }
  revalidatePath('/painel/meu')
  return {
    ok: true,
    message: carsRemoved || entriesRemoved
      ? `Limpo: ${carsRemoved} carros repetidos e ${entriesRemoved} movimentações repetidas removidos.`
      : 'Nada repetido encontrado.',
  }
}

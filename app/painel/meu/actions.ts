'use server'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireOwner } from '@/lib/auth'
import { deleteVehicleFinance, getFinanceConfig, listAllFinance, saveVehicleFinance } from '@/lib/finance-store'
import { buildImport, carKey, entryKey, historicalId } from '@/lib/personal-import'
import { getLedger, saveLedger } from '@/lib/personal-store'
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

  const all = await listAllFinance()
  const taken = new Set(all.map((f) => f.vehicleId))
  const byName = new Map<string, string>()
  for (const f of all.filter((f) => f.vehicleId.startsWith('hist-')).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))) {
    byName.set(carKey(f.snapshot.name), f.vehicleId)
  }
  let created = 0
  let updated = 0
  for (const car of plan.cars) {
    const key = carKey(car.finance.snapshot.name)
    let id = byName.get(key)
    if (id) updated++
    else {
      id = historicalId(car.finance.snapshot.name)
      while (taken.has(id)) id = historicalId(car.finance.snapshot.name)
      taken.add(id)
      byName.set(key, id)
      created++
    }
    const error = await saveVehicleFinance({ ...car.finance, vehicleId: id, updatedAt: '' })
    if (error) return { ok: false, message: `Erro ao salvar ${car.finance.snapshot.name}: ${error}` }
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
  revalidatePath('/painel/financeiro')
  const skipped = plan.entries.length - addedCount
  return {
    ok: true,
    message: `Pronto: ${created} carros novos, ${updated} atualizados; ${addedCount} movimentações novas${skipped ? ` (${skipped} já existiam, ignoradas)` : ''}.`,
  }
}

/** Remove cópias: carros históricos com o mesmo nome (fica o mais recente) e movimentações idênticas. */
export async function removerDuplicados(): Promise<ImportState> {
  const { user } = await requireOwner()
  const hist = (await listAllFinance())
    .filter((f) => f.vehicleId.startsWith('hist-'))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const keep = new Set<string>()
  let carsRemoved = 0
  for (const f of hist) {
    const k = carKey(f.snapshot.name)
    if (!keep.has(k)) {
      keep.add(k)
      continue
    }
    const error = await deleteVehicleFinance(f.vehicleId)
    if (error) return { ok: false, message: `Erro ao apagar ${f.snapshot.name}: ${error}` }
    carsRemoved++
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
  revalidatePath('/painel/financeiro')
  return {
    ok: true,
    message: carsRemoved || entriesRemoved
      ? `Limpo: ${carsRemoved} carros repetidos e ${entriesRemoved} movimentações repetidas removidos.`
      : 'Nada repetido encontrado.',
  }
}

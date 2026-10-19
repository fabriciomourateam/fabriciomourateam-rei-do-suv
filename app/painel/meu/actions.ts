'use server'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireOwner } from '@/lib/auth'
import { getFinanceConfig, listAllFinance, saveVehicleFinance } from '@/lib/finance-store'
import { buildImport, historicalId } from '@/lib/personal-import'
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

/** Importação aditiva: cria carros históricos e acrescenta movimentações. Nunca apaga nada. */
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

  const taken = new Set((await listAllFinance()).map((f) => f.vehicleId))
  for (const car of plan.cars) {
    let id = historicalId(car.finance.snapshot.name)
    while (taken.has(id)) id = historicalId(car.finance.snapshot.name)
    taken.add(id)
    const error = await saveVehicleFinance({ ...car.finance, vehicleId: id, updatedAt: '' })
    if (error) return { ok: false, message: `Erro ao salvar ${car.finance.snapshot.name}: ${error}` }
  }
  if (plan.entries.length) {
    const ledger = await getLedger(user.id)
    const added: LedgerEntry[] = plan.entries.map((e) => ({ id: randomUUID(), ...e }))
    const error = await saveLedger(user.id, [...ledger.entries, ...added])
    if (error) return { ok: false, message: `Erro ao salvar as movimentações: ${error}` }
  }
  revalidatePath('/painel/meu')
  revalidatePath('/painel/financeiro')
  return {
    ok: true,
    message: `Importado: ${plan.entries.length} movimentações e ${plan.cars.length} carros.`,
  }
}

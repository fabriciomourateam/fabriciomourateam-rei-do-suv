'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { COST_CATEGORIES, SALE_DEDUCTED, SPLIT_EQUAL } from '@/lib/finance'
import { getFinanceConfig, saveFinanceConfig, saveVehicleFinance } from '@/lib/finance-store'
import type { VehicleFinance } from '@/lib/finance'

const cents = z.number().int().min(0).max(100_000_000_000).nullable()
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
const who = z.string().max(40).nullable()
const text = z.string().trim().max(2000)

const financeSchema = z.object({
  vehicleId: z.string().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/),
  snapshot: z.object({ name: text, version: text, year: text }),
  purchase: z.object({ amountCents: cents, date, paidBy: who, note: text }),
  costs: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        category: z.enum(COST_CATEGORIES as [string, ...string[]]),
        description: text,
        amountCents: z.number().int().min(0).max(100_000_000_000),
        date,
        paidBy: who,
      }),
    )
    .max(200),
  sale: z.object({ amountCents: cents, date, receivedBy: who, note: text }),
})

export async function saveFinance(formData: FormData) {
  await requireAdmin()
  const vehicleId = String(formData.get('vehicleId') ?? '')
  const back = `/painel/financeiro/${vehicleId}`
  let json: unknown
  try {
    json = JSON.parse(String(formData.get('payload') ?? ''))
  } catch {
    redirect(`${back}?erro=${encodeURIComponent('Dados inválidos.')}`)
  }
  const parsed = financeSchema.safeParse(json)
  if (!parsed.success) redirect(`${back}?erro=${encodeURIComponent('Confira os valores informados.')}`)
  const data = parsed.data as Omit<VehicleFinance, 'updatedAt'>
  const config = await getFinanceConfig()
  const valid = new Set(config.partners.map((p) => p.id))
  const clean = (v: string | null) => (v && (valid.has(v) || v === SPLIT_EQUAL) ? v : null)
  const cleanCost = (v: string | null) => (v === SALE_DEDUCTED ? v : clean(v))
  const toSave: VehicleFinance = {
    ...data,
    purchase: { ...data.purchase, paidBy: clean(data.purchase.paidBy) },
    costs: data.costs.map((c) => ({ ...c, paidBy: cleanCost(c.paidBy) })),
    sale: { ...data.sale, receivedBy: clean(data.sale.receivedBy) },
    updatedAt: '',
  }
  const error = await saveVehicleFinance(toSave)
  if (error) redirect(`${back}?erro=${encodeURIComponent(error)}`)
  revalidatePath('/painel/financeiro')
  revalidatePath(back)
  redirect(`${back}?ok=1`)
}

const configSchema = z.object({
  p1: z.string().trim().min(1).max(40),
  p2: z.string().trim().min(1).max(40),
  pct1: z.number().min(0).max(100),
})

export async function saveConfig(formData: FormData) {
  await requireAdmin()
  const back = '/painel/financeiro/config'
  const num = (k: string) => Number(String(formData.get(k) ?? '').replace(',', '.'))
  const parsed = configSchema.safeParse({
    p1: String(formData.get('name1') ?? ''),
    p2: String(formData.get('name2') ?? ''),
    pct1: num('pct1'),
  })
  const pct2 = num('pct2')
  if (!parsed.success || !Number.isFinite(pct2)) redirect(`${back}?erro=${encodeURIComponent('Confira nomes e percentuais.')}`)
  const { p1, p2, pct1 } = parsed.data
  if (Math.abs(pct1 + pct2 - 100) > 0.001 || pct2 < 0 || pct2 > 100) {
    redirect(`${back}?erro=${encodeURIComponent('Os percentuais precisam somar 100%.')}`)
  }
  const error = await saveFinanceConfig({
    partners: [
      { id: 'p1', name: p1, pct: pct1 },
      { id: 'p2', name: p2, pct: pct2 },
    ],
  })
  if (error) redirect(`${back}?erro=${encodeURIComponent(error)}`)
  revalidatePath('/painel/financeiro', 'layout')
  redirect(`${back}?ok=1`)
}

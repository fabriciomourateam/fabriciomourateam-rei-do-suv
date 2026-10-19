/**
 * Importação em lote (JSON preparado pelo Claude). Puro: usado no preview (cliente) e na action (servidor).
 * Valores aceitam texto em BRL ("12.547,39") ou número em reais.
 */
import { z } from 'zod'
import {
  COST_CATEGORIES,
  emptyVehicleFinance,
  parseBRL,
  SALE_DEDUCTED,
  SPLIT_EQUAL,
  type CostCategory,
  type Partner,
  type VehicleFinance,
} from './finance'
import { defaultDirection, ENTRY_TYPES, type Direction, type EntryType, type LedgerEntry } from './personal'
import { toSlug } from './slug'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const money = z.union([z.string().max(40), z.number().finite()])
const text = (max: number) => z.string().trim().max(max)
const optText = (max: number) => z.string().trim().max(max).nullish()
const optDate = z.string().trim().regex(DATE, 'data deve ser AAAA-MM-DD').nullish().or(z.literal(''))

const movSchema = z.object({
  data: z.string().trim().regex(DATE, 'data deve ser AAAA-MM-DD'),
  tipo: z.enum(ENTRY_TYPES as [EntryType, ...EntryType[]]),
  direcao: z.enum(['entrada', 'saida']).nullish(),
  descricao: text(300),
  valor: money,
  carro: optText(120),
  obs: optText(1000),
})

const custoSchema = z.object({
  categoria: z.enum(COST_CATEGORIES as [CostCategory, ...CostCategory[]]).nullish(),
  descricao: optText(300),
  valor: money,
  data: optDate,
  pagoPor: optText(60),
  dividir: z.boolean().nullish(),
})

const carroSchema = z.object({
  nome: text(120).min(1, 'nome é obrigatório'),
  versao: optText(120),
  ano: optText(20),
  placa: optText(20),
  compra: z
    .object({ valor: money.nullish(), data: optDate, pagoPor: optText(60) })
    .nullish(),
  custos: z.array(custoSchema).max(100).nullish(),
  venda: z
    .object({ valor: money.nullish(), data: optDate, recebidoPor: optText(60) })
    .nullish(),
})

export const importSchema = z.object({
  movimentacoes: z.array(movSchema).max(500).nullish(),
  carros: z.array(carroSchema).max(100).nullish(),
})

export type ImportResult =
  | { ok: true; entries: Omit<LedgerEntry, 'id'>[]; cars: { finance: Omit<VehicleFinance, 'vehicleId' | 'updatedAt'>; placa: string }[] }
  | { ok: false; errors: string[] }

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

function toCents(v: string | number | null | undefined): number | null {
  if (v == null) return null
  if (typeof v === 'number') {
    const c = Math.round(v * 100)
    return Number.isSafeInteger(c) ? c : null
  }
  return parseBRL(v)
}

/** Nome do sócio / "Metade cada" / "Descontado da venda" -> id armazenado. undefined = não reconhecido. */
function resolveWho(raw: string | null | undefined, partners: Partner[], allowSale: boolean): string | null | undefined {
  const n = norm(raw ?? '')
  if (!n) return null
  const byName = partners.find((p) => norm(p.name) === n || p.id === n)
  if (byName) return byName.id
  if (n === 'metade cada' || n === 'metade' || n === 'meio a meio' || n === '50/50') return SPLIT_EQUAL
  if (allowSale && (n === 'descontado da venda' || n === 'desconto na venda')) return SALE_DEDUCTED
  return undefined
}

export function buildImport(input: unknown, partners: Partner[]): ImportResult {
  const parsed = importSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.slice(0, 20).map((i) => `${i.path.join('.') || 'raiz'}: ${i.message}`),
    }
  }
  const errors: string[] = []
  const entries: Omit<LedgerEntry, 'id'>[] = []
  const cars: { finance: Omit<VehicleFinance, 'vehicleId' | 'updatedAt'>; placa: string }[] = []

  ;(parsed.data.movimentacoes ?? []).forEach((m, i) => {
    const at = `movimentacoes[${i}]`
    const cents = toCents(m.valor)
    if (cents == null || cents <= 0) {
      errors.push(`${at}: valor inválido (precisa ser maior que zero)`)
      return
    }
    const direction: Direction | null = m.direcao ?? defaultDirection(m.tipo)
    if (!direction) {
      errors.push(`${at}: informe "direcao" (entrada ou saida) para o tipo ${m.tipo}`)
      return
    }
    entries.push({
      date: m.data,
      type: m.tipo,
      description: m.descricao,
      amountCents: cents,
      direction,
      vehicleRef: m.carro ?? '',
      note: m.obs ?? '',
    })
  })

  ;(parsed.data.carros ?? []).forEach((c, i) => {
    const at = `carros[${i}] (${c.nome})`
    const base = emptyVehicleFinance('tmp', { name: c.nome, version: c.versao ?? '', year: c.ano ?? '' })
    const money = (v: string | number | null | undefined, where: string): number | null => {
      if (v == null || v === '') return null
      const x = toCents(v)
      if (x == null || x < 0) errors.push(`${at}: ${where} com valor inválido`)
      return x != null && x >= 0 ? x : null
    }
    const who = (raw: string | null | undefined, where: string, allowSale: boolean): string | null => {
      const r = resolveWho(raw, partners, allowSale)
      if (r === undefined) {
        errors.push(`${at}: ${where} "${raw}" não é um sócio conhecido (${partners.map((p) => p.name).join(', ')}, Metade cada${allowSale ? ', Descontado da venda' : ''})`)
        return null
      }
      return r
    }
    const placa = c.placa ?? ''
    const purchase = {
      amountCents: money(c.compra?.valor, 'compra'),
      date: c.compra?.data || null,
      paidBy: who(c.compra?.pagoPor, 'compra.pagoPor', false),
      note: placa ? `Placa ${placa}` : '',
    }
    const costs = (c.custos ?? []).map((k, j) => ({
      id: `i${j}${Math.random().toString(36).slice(2, 6)}`,
      category: k.categoria ?? ('outros' as CostCategory),
      description: k.descricao ?? '',
      amountCents: money(k.valor, `custos[${j}]`) ?? 0,
      date: k.data || null,
      paidBy: who(k.pagoPor, `custos[${j}].pagoPor`, true),
      shared: k.dividir !== false,
    }))
    const sale = {
      amountCents: money(c.venda?.valor, 'venda'),
      date: c.venda?.data || null,
      receivedBy: who(c.venda?.recebidoPor, 'venda.recebidoPor', false),
      note: '',
    }
    cars.push({ placa, finance: { snapshot: base.snapshot, purchase, costs, sale } })
  })

  if (errors.length) return { ok: false, errors: errors.slice(0, 30) }
  if (!entries.length && !cars.length) return { ok: false, errors: ['Nada para importar: informe "movimentacoes" e/ou "carros".'] }
  return { ok: true, entries, cars }
}

/** hist-{slug}-{random4}; só [a-z0-9-]. */
export function historicalId(name: string, rand: () => string = () => Math.random().toString(36).slice(2, 6).padEnd(4, '0')): string {
  const slug = toSlug(name).slice(0, 40) || 'carro'
  return `hist-${slug}-${rand()}`
}

/** Chave para reconhecer o mesmo carro histórico entre importações (nome, sem acento/caixa). */
export function carKey(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Chave para reconhecer a mesma movimentação entre importações. */
export function entryKey(e: { date: string; type: string; direction: string; amountCents: number; description: string }): string {
  return [e.date, e.type, e.direction, e.amountCents, carKey(e.description)].join('|')
}

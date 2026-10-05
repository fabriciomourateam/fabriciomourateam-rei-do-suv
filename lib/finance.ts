/** Financeiro (puro, sem I/O): valores sempre em CENTAVOS inteiros. */

export type CostCategory = 'auto_avaliar' | 'manutencao' | 'transporte' | 'documentacao' | 'estetica' | 'comissao' | 'outros'

export const COST_CATEGORIES: CostCategory[] = [
  'auto_avaliar', 'manutencao', 'transporte', 'documentacao', 'estetica', 'comissao', 'outros',
]

export const COST_LABEL: Record<CostCategory, string> = {
  auto_avaliar: 'Auto Avaliar (taxa da plataforma)',
  manutencao: 'Manutenção',
  transporte: 'Transporte (frete/guincho)',
  documentacao: 'Documentação / despachante',
  estetica: 'Estética / higienização',
  comissao: 'Comissão',
  outros: 'Outros',
}

export const COST_SHORT: Record<CostCategory, string> = {
  auto_avaliar: 'Auto Avaliar',
  manutencao: 'Manutenção',
  transporte: 'Transporte',
  documentacao: 'Documentação',
  estetica: 'Estética',
  comissao: 'Comissão',
  outros: 'Outros',
}

export interface Partner {
  id: string
  name: string
  pct: number
}

export interface FinanceConfig {
  partners: Partner[]
}

export interface CostItem {
  id: string
  category: CostCategory
  description: string
  amountCents: number
  date: string | null
  paidBy: string | null
}

export interface VehicleFinance {
  vehicleId: string
  snapshot: { name: string; version: string; year: string }
  purchase: { amountCents: number | null; date: string | null; paidBy: string | null; note: string }
  costs: CostItem[]
  sale: { amountCents: number | null; date: string | null; receivedBy: string | null; note: string }
  updatedAt: string
}

export const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
  partners: [
    { id: 'p1', name: 'Fabricio', pct: 50 },
    { id: 'p2', name: 'Élcio', pct: 50 },
  ],
}

export function emptyVehicleFinance(vehicleId: string, snapshot?: Partial<VehicleFinance['snapshot']>): VehicleFinance {
  return {
    vehicleId,
    snapshot: { name: snapshot?.name ?? '', version: snapshot?.version ?? '', year: snapshot?.year ?? '' },
    purchase: { amountCents: null, date: null, paidBy: null, note: '' },
    costs: [],
    sale: { amountCents: null, date: null, receivedBy: null, note: '' },
    updatedAt: '',
  }
}

/** '85.000,50' -> 8500050. Aceita '85000', '85.000', '85000,5', 'R$ 1.234,56'. Vazio/inválido -> null. */
export function parseBRL(input: string): number | null {
  let s = input.replace(/R\$/gi, '').replace(/\s/g, '')
  if (!s) return null
  s = s.replace(/[^\d.,-]/g, '')
  const negative = s.startsWith('-')
  s = s.replace(/-/g, '')
  if (!s) return null
  let intPart: string
  let decPart = ''
  const comma = s.lastIndexOf(',')
  if (comma >= 0) {
    intPart = s.slice(0, comma).replace(/\./g, '')
    decPart = s.slice(comma + 1).replace(/[.,]/g, '')
  } else {
    // Sem vírgula: ponto seguido de exatamente 2 dígitos finais, sem outros pontos, é decimal ("85.50"); senão milhar.
    const m = /^(\d+)\.(\d{1,2})$/.exec(s)
    if (m) {
      intPart = m[1]
      decPart = m[2]
    } else {
      intPart = s.replace(/\./g, '')
    }
  }
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(decPart)) return null
  if (!intPart && !decPart) return null
  const cents = Number(intPart || '0') * 100 + Number((decPart + '00').slice(0, 2))
  if (!Number.isSafeInteger(cents)) return null
  return negative ? -cents : cents
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 8500050 -> 'R$ 85.000,50' (espaço normal no lugar do NBSP). */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ')
}

/** Só o número, sem símbolo: 8500050 -> '85.000,50' (para campos de entrada). */
export function formatAmountInput(cents: number | null): string {
  if (cents == null) return ''
  return formatBRL(cents).replace(/^(-?)R\$ /, '$1')
}

export interface PartnerResult {
  partnerId: string
  name: string
  pct: number
  share: number
  paid: number
  received: number
  /** positivo = deve RECEBER; negativo = deve PAGAR */
  settlement: number
}

export interface FinanceResult {
  purchase: number
  costsTotal: number
  costsByCategory: Record<CostCategory, number>
  totalInvested: number
  sale: number | null
  /** custos marcados como "descontado da venda" */
  deductedFromSale: number
  /** venda − custos descontados da venda (o que de fato entrou) */
  saleNet: number | null
  profit: number | null
  marginPct: number | null
  roiPct: number | null
  perPartner: PartnerResult[]
}

/** Valor especial de "quem pagou/recebeu": dividido igualmente entre os sócios (metade cada). */
export const SPLIT_EQUAL = 'meio'
/** Valor especial de "quem pagou" de um custo: foi descontado direto do valor da venda. */
export const SALE_DEDUCTED = 'venda'

/** Divide em partes iguais (centavos); o resto vai para os primeiros. */
export function splitEqually(amount: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.trunc(amount / n)
  const out = Array.from({ length: n }, () => base)
  let rest = amount - base * n
  for (let i = 0; rest !== 0 && i < n; i++) {
    const step = Math.sign(rest)
    out[i] += step
    rest -= step
  }
  return out
}

export function computeFinance(f: VehicleFinance, partners: Partner[]): FinanceResult {
  const purchase = f.purchase.amountCents ?? 0
  const costsByCategory = Object.fromEntries(COST_CATEGORIES.map((c) => [c, 0])) as Record<CostCategory, number>
  let costsTotal = 0
  for (const c of f.costs) {
    costsByCategory[c.category] += c.amountCents
    costsTotal += c.amountCents
  }
  const totalInvested = purchase + costsTotal
  const sale = f.sale.amountCents
  const profit = sale == null ? null : sale - totalInvested
  const marginPct = profit != null && sale ? (profit / sale) * 100 : null
  const roiPct = profit != null && totalInvested ? (profit / totalInvested) * 100 : null

  // Divisão do lucro: arredonda cada parte para baixo (em direção a zero) e o resto vai pro primeiro sócio.
  const shares = partners.map((p) => (profit == null ? 0 : Math.trunc((profit * p.pct) / 100)))
  if (profit != null && shares.length > 0) {
    const pctSum = partners.reduce((a, p) => a + p.pct, 0)
    if (pctSum === 100) shares[0] += profit - shares.reduce((a, b) => a + b, 0)
  }

  // Custos descontados direto do valor da venda (ex.: taxa da Auto Avaliar cobrada na venda):
  // ninguém pagou do bolso; quem recebeu a venda recebeu o valor já líquido.
  const deductedFromSale = f.costs.reduce((a, c) => a + (c.paidBy === SALE_DEDUCTED ? c.amountCents : 0), 0)
  const saleNet = sale == null ? null : sale - deductedFromSale

  /** Quanto do valor `amount` cabe ao sócio `i`, conforme quem pagou/recebeu. */
  const portion = (who: string | null, amount: number, i: number, p: Partner) => {
    if (who === p.id) return amount
    if (who === SPLIT_EQUAL) return splitEqually(amount, partners.length)[i] ?? 0
    return 0
  }

  const perPartner = partners.map((p, i) => {
    const paid = portion(f.purchase.paidBy, purchase, i, p) + f.costs.reduce((a, c) => a + portion(c.paidBy, c.amountCents, i, p), 0)
    const received = saleNet == null ? 0 : portion(f.sale.receivedBy, saleNet, i, p)
    const share = shares[i]
    return { partnerId: p.id, name: p.name, pct: p.pct, share, paid, received, settlement: paid + share - received }
  })

  return { purchase, costsTotal, costsByCategory, totalInvested, sale, deductedFromSale, saleNet, profit, marginPct, roiPct, perPartner }
}

export function formatPct(v: number | null): string {
  if (v == null) return '—'
  return `${v.toFixed(1).replace('.', ',')}%`
}

/** 'AAAA-MM' de uma data 'AAAA-MM-DD' (ou null). */
export function monthOf(date: string | null): string | null {
  return date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : null
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const names = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${names[Number(m) - 1] ?? m} de ${y}`
}

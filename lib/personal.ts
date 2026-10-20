/** Financeiro pessoal do dono (puro, sem I/O): valores em CENTAVOS inteiros, sempre positivos nas movimentações. */
import { COST_LABEL, computeFinance, isSharedCost, monthOf, type Partner, type VehicleFinance } from './finance'

export type EntryType = 'aporte' | 'retirada' | 'pagamento' | 'recebimento' | 'acerto_socio' | 'outro'
export type Direction = 'saida' | 'entrada'

export const ENTRY_TYPES: EntryType[] = ['aporte', 'retirada', 'pagamento', 'recebimento', 'acerto_socio', 'outro']

export const ENTRY_LABEL: Record<EntryType, string> = {
  aporte: 'Aporte (dinheiro que coloquei)',
  retirada: 'Retirada',
  pagamento: 'Pagamento (paguei algo)',
  recebimento: 'Recebimento (recebi)',
  acerto_socio: 'Acerto com sócio',
  outro: 'Outro',
}

export const ENTRY_SHORT: Record<EntryType, string> = {
  aporte: 'Aporte',
  retirada: 'Retirada',
  pagamento: 'Pagamento',
  recebimento: 'Recebimento',
  acerto_socio: 'Acerto com sócio',
  outro: 'Outro',
}

export interface LedgerEntry {
  id: string
  /** AAAA-MM-DD */
  date: string
  type: EntryType
  description: string
  /** sempre positivo; o sentido está em `direction` */
  amountCents: number
  direction: Direction
  /** nome do carro em texto livre (opcional, '') */
  vehicleRef: string
  note: string
}

export interface PersonalLedger {
  entries: LedgerEntry[]
  updatedAt: string
}

/** Sentido padrão por tipo; acerto_socio/outro dependem de quem lança (null). */
export function defaultDirection(type: EntryType): Direction | null {
  if (type === 'aporte' || type === 'pagamento') return 'saida'
  if (type === 'retirada' || type === 'recebimento') return 'entrada'
  return null
}

export interface LedgerTotals {
  entradas: number
  saidas: number
  /** entradas − saídas */
  saldo: number
}

export function ledgerTotals(entries: LedgerEntry[]): LedgerTotals {
  let entradas = 0
  let saidas = 0
  for (const e of entries) {
    if (e.direction === 'entrada') entradas += e.amountCents
    else saidas += e.amountCents
  }
  return { entradas, saidas, saldo: entradas - saidas }
}

export interface LedgerRow extends LedgerEntry {
  /** saldo acumulado até esta movimentação (ordem cronológica) */
  balance: number
}

/**
 * Saldo acumulado em ordem cronológica (data crescente; empate: ordem original da lista),
 * devolvido com a data mais recente primeiro.
 */
export function withRunningBalance(entries: LedgerEntry[]): LedgerRow[] {
  const chrono = entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : a.i - b.i))
  let acc = 0
  const rows = chrono.map(({ e }) => {
    acc += e.direction === 'entrada' ? e.amountCents : -e.amountCents
    return { ...e, balance: acc }
  })
  return rows.reverse()
}

export interface OwnerCar {
  vehicleId: string
  name: string
  version: string
  year: string
  sold: boolean
  saleDate: string | null
  /** o que eu desembolsei em compra + custos divididos */
  myPaid: number
  /** o que eu recebi da venda (valor líquido) */
  myReceived: number
  /** custos que só eu banquei (não divididos) */
  myOwnCosts: number
  /** minha parte do lucro dividido (null se não vendido) */
  myProfitShare: number | null
  /** minha parte − custos só meus (null se não vendido) */
  myRealProfit: number | null
  /**
   * Acerto com o sócio neste carro (null se não vendido).
   * POSITIVO = o sócio me deve; NEGATIVO = eu devo ao sócio.
   */
  mySettlement: number | null
  /** dinheiro parado: o que coloquei num carro ainda não vendido (null se vendido) */
  capitalEmpatado: number | null
  purchaseDate: string | null
  /** valor da venda (null se não vendido) */
  saleAmount: number | null
  /** lucro total do carro, antes de dividir (null se não vendido) */
  totalProfit: number | null
  /** dias entre compra e venda (null sem as duas datas) */
  days: number | null
  /** lucro real ÷ meu dinheiro no carro (compra + custos), por mês de 30 dias, em % (null sem dados) */
  monthlyPct: number | null
  /** custos que só eu banquei, item a item (para o tooltip das taxas) */
  myOwnCostItems: { label: string; amountCents: number }[]
}

/** Dias entre duas datas AAAA-MM-DD (null se faltar alguma ou se fim < início). */
export function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const a = Date.parse(`${start}T00:00:00Z`)
  const b = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return Math.round((b - a) / 86_400_000)
}

/** Rendimento simples ao mês (30 dias) em %: lucro ÷ capital ÷ (dias/30). */
export function monthlyReturnPct(profit: number | null, capital: number, days: number | null): number | null {
  if (profit == null || !capital || days == null) return null
  return (profit / capital) * 100 / (Math.max(days, 1) / 30)
}

const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

export function ownerCarSummary(finances: VehicleFinance[], partners: Partner[], ownerPartnerId = 'p1'): OwnerCar[] {
  return finances.map((f) => {
    const r = computeFinance(f, partners)
    const me = r.perPartner.find((p) => p.partnerId === ownerPartnerId)
    const sold = f.sale.amountCents != null
    const myPaid = me?.paid ?? 0
    return {
      vehicleId: f.vehicleId,
      name: f.snapshot.name || 'Veículo',
      version: f.snapshot.version,
      year: f.snapshot.year,
      sold,
      saleDate: f.sale.date,
      myPaid,
      myReceived: me?.received ?? 0,
      myOwnCosts: me?.ownCosts ?? 0,
      myProfitShare: sold ? (me?.share ?? 0) : null,
      myRealProfit: sold ? (me?.realProfit ?? 0) : null,
      mySettlement: sold ? (me?.settlement ?? 0) : null,
      capitalEmpatado: sold ? null : myPaid,
      purchaseDate: f.purchase.date,
      saleAmount: sold ? f.sale.amountCents : null,
      totalProfit: sold ? r.profit : null,
      days: sold ? daysBetween(f.purchase.date, f.sale.date) : daysBetween(f.purchase.date, todayISO()),
      monthlyPct: sold ? monthlyReturnPct(me?.realProfit ?? 0, myPaid + (me?.ownCosts ?? 0), daysBetween(f.purchase.date, f.sale.date)) : null,
      myOwnCostItems: f.costs
        .filter((c) => !isSharedCost(c) && c.paidBy === ownerPartnerId && c.amountCents)
        .map((c) => ({ label: c.description || COST_LABEL[c.category], amountCents: c.amountCents })),
    }
  })
}

export interface OwnerTotals {
  /** soma das minhas partes do lucro dos carros vendidos */
  lucroRecebido: number
  /** soma do lucro real (parte − custos só meus) dos carros vendidos */
  lucroReal: number
  capitalEmpatado: number
  /** soma dos acertos dos carros vendidos (+ = sócio me deve; − = eu devo) */
  acertoCarros: number
  /** acertos lançados no caderno: entrada = o sócio me pagou; saída = eu paguei o sócio */
  acertoEntradas: number
  acertoSaidas: number
  /**
   * Acerto em aberto. SINAL: positivo = o sócio (Élcio) me deve; negativo = eu devo ao Élcio.
   * = acertoCarros − acertoEntradas + acertoSaidas
   *   (entrada reduz o que ele me deve; saída reduz o que eu devo)
   */
  acertoAberto: number
}

export function ownerTotals(cars: OwnerCar[], entries: LedgerEntry[]): OwnerTotals {
  let lucroRecebido = 0
  let lucroReal = 0
  let capitalEmpatado = 0
  let acertoCarros = 0
  for (const c of cars) {
    if (c.sold) {
      lucroRecebido += c.myProfitShare ?? 0
      lucroReal += c.myRealProfit ?? 0
      acertoCarros += c.mySettlement ?? 0
    } else {
      capitalEmpatado += c.capitalEmpatado ?? 0
    }
  }
  let acertoEntradas = 0
  let acertoSaidas = 0
  for (const e of entries) {
    if (e.type !== 'acerto_socio') continue
    if (e.direction === 'entrada') acertoEntradas += e.amountCents
    else acertoSaidas += e.amountCents
  }
  return {
    lucroRecebido,
    lucroReal,
    capitalEmpatado,
    acertoCarros,
    acertoEntradas,
    acertoSaidas,
    acertoAberto: acertoCarros - acertoEntradas + acertoSaidas,
  }
}

/** Texto do acerto (sinal: + o sócio deve a mim; − eu devo ao sócio). */
export function settlementText(cents: number, partnerName: string, format: (c: number) => string): string {
  if (cents > 0) return `${partnerName} te deve ${format(cents)}`
  if (cents < 0) return `Você deve ao ${partnerName} ${format(-cents)}`
  return 'Quites'
}

export function inMonth(date: string | null, ym: string): boolean {
  return !ym || monthOf(date) === ym
}

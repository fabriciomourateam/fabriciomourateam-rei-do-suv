/**
 * "Minha carteira": quanto saiu do meu bolso, quanto tenho hoje e quanto rendeu (puro, sem I/O).
 * Valores em CENTAVOS. Datas AAAA-MM-DD.
 *
 * Os aportes são deduzidos do histórico: em ordem de data, cada carro consome primeiro o
 * dinheiro que já voltou de vendas (caixa); o que faltar saiu do bolso (aporte).
 * Carros em estoque entram pelo que custaram (sem lucro estimado).
 */
import type { OwnerCar, LedgerEntry } from './personal'
import { daysBetween } from './personal'

export interface Aporte {
  date: string
  amountCents: number
  /** carro(s) que pediram esse dinheiro */
  cars: string[]
}

export interface ReceivableItem {
  name: string
  /** + = o sócio me deve; − = eu devo ao sócio */
  amountCents: number
}

export interface Portfolio {
  start: { date: string; amountCents: number; car: string } | null
  aportes: Aporte[]
  totalAportes: number
  retiradas: number
  /** dinheiro que voltou e ainda não foi reinvestido */
  caixa: number
  /** acerto em aberto com o sócio (+ = a receber), detalhado por carro */
  receber: number
  receberItems: ReceivableItem[]
  /** carros em estoque, pelo que me custaram */
  estoque: number
  estoqueCount: number
  valorAtual: number
  lucro: number
  /** lucro ÷ o que saiu do bolso, em % */
  lucroPct: number | null
  days: number | null
  /** rendimento simples ao mês, ponderado pelo tempo de cada aporte, em % */
  monthlyPct: number | null
  cdiMonthlyPct: number
  /** quanto os mesmos aportes, nas mesmas datas, teriam rendido no CDI */
  cdiGain: number
}

interface Flow {
  date: string
  /** + entra no caixa, − sai */
  amount: number
  car?: string
  kind: 'carro' | 'acerto' | 'retirada' | 'despesa'
}

export function computePortfolio(cars: OwnerCar[], entries: LedgerEntry[], today: string, cdiAnnualPct: number): Portfolio {
  const flows: Flow[] = []
  for (const c of cars) {
    const cost = c.myPaid + c.myOwnCosts
    if (cost > 0 && c.purchaseDate) flows.push({ date: c.purchaseDate, amount: -cost, car: c.name, kind: 'carro' })
  }
  for (const e of entries) {
    if (e.type === 'aporte') continue // aportes são deduzidos, não lançados
    if (e.type === 'retirada') flows.push({ date: e.date, amount: -e.amountCents, kind: 'retirada' })
    else flows.push({ date: e.date, amount: e.direction === 'entrada' ? e.amountCents : -e.amountCents, kind: e.type === 'acerto_socio' ? 'acerto' : 'despesa' })
  }
  // Mesmo dia: o que entra vem antes do que sai (o dinheiro da venda paga o carro novo).
  flows.sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount)

  let caixa = 0
  let retiradas = 0
  const aportes: Aporte[] = []
  for (const f of flows) {
    caixa += f.amount
    if (f.kind === 'retirada') retiradas -= f.amount
    if (caixa < 0) {
      const last = aportes[aportes.length - 1]
      if (last && last.date === f.date) {
        last.amountCents += -caixa
        if (f.car) last.cars.push(f.car)
      } else aportes.push({ date: f.date, amountCents: -caixa, cars: f.car ? [f.car] : [] })
      caixa = 0
    }
  }

  // A receber / a pagar ao sócio, por carro: acerto do carro − o que já foi acertado com referência a ele.
  const settledByCar = new Map<string, number>()
  let settledLoose = 0
  for (const e of entries) {
    if (e.type !== 'acerto_socio') continue
    const v = e.direction === 'entrada' ? e.amountCents : -e.amountCents
    if (e.vehicleRef) settledByCar.set(e.vehicleRef, (settledByCar.get(e.vehicleRef) ?? 0) + v)
    else settledLoose += v
  }
  const receberItems: ReceivableItem[] = []
  for (const c of cars) {
    if (!c.sold || c.mySettlement == null) continue
    const open = c.mySettlement - (settledByCar.get(c.name) ?? 0)
    if (open) receberItems.push({ name: c.name, amountCents: open })
  }
  if (settledLoose) receberItems.push({ name: 'Acertos sem carro', amountCents: -settledLoose })
  const receber = receberItems.reduce((a, i) => a + i.amountCents, 0)

  const stock = cars.filter((c) => !c.sold)
  const estoque = stock.reduce((a, c) => a + c.myPaid + c.myOwnCosts, 0)
  const totalAportes = aportes.reduce((a, x) => a + x.amountCents, 0)
  const valorAtual = estoque + caixa + receber
  const lucro = valorAtual + retiradas - totalAportes

  // Capital × tempo: cada aporte pesa pelos dias que está investido.
  let capitalMonths = 0
  let cdiGain = 0
  const cdiDaily = Math.pow(1 + cdiAnnualPct / 100, 1 / 365) - 1
  for (const a of aportes) {
    const d = daysBetween(a.date, today) ?? 0
    capitalMonths += a.amountCents * (Math.max(d, 1) / 30)
    cdiGain += a.amountCents * (Math.pow(1 + cdiDaily, d) - 1)
  }

  const first = aportes[0]
  return {
    start: first ? { date: first.date, amountCents: first.amountCents, car: first.cars[0] ?? '' } : null,
    aportes,
    totalAportes,
    retiradas,
    caixa,
    receber,
    receberItems,
    estoque,
    estoqueCount: stock.length,
    valorAtual,
    lucro,
    lucroPct: totalAportes ? (lucro / totalAportes) * 100 : null,
    days: first ? daysBetween(first.date, today) : null,
    monthlyPct: capitalMonths ? (lucro / capitalMonths) * 100 : null,
    cdiMonthlyPct: (Math.pow(1 + cdiAnnualPct / 100, 1 / 12) - 1) * 100,
    cdiGain: Math.round(cdiGain),
  }
}

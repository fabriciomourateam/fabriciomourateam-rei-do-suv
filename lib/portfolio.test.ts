import { describe, expect, it } from 'vitest'
import { computePortfolio } from './portfolio'
import type { LedgerEntry, OwnerCar } from './personal'

const car = (o: Partial<OwnerCar>): OwnerCar => ({
  vehicleId: o.name ?? 'x', name: 'x', version: '', year: '', sold: false, saleDate: null, myPaid: 0, myReceived: 0, myOwnCosts: 0,
  myProfitShare: null, myRealProfit: null, mySettlement: null, capitalEmpatado: null, purchaseDate: null, saleAmount: null,
  totalProfit: null, days: null, monthlyPct: null, myOwnCostItems: [], ...o,
})
const entry = (o: Partial<LedgerEntry>): LedgerEntry => ({ id: 'e', date: '', type: 'acerto_socio', description: '', amountCents: 0, direction: 'entrada', vehicleRef: '', note: '', ...o })

describe('carteira', () => {
  it('reinveste o que voltou antes de pedir dinheiro novo e fecha a conta', () => {
    const cars = [
      car({ name: 'A', purchaseDate: '2026-01-01', myPaid: 100_000, myOwnCosts: 1_000, sold: true, saleDate: '2026-02-01', mySettlement: 107_500, myRealProfit: 6_500 }),
      car({ name: 'B', purchaseDate: '2026-02-01', myPaid: 120_000 }),
    ]
    const entries = [entry({ date: '2026-02-01', amountCents: 107_500, vehicleRef: 'A' })]
    const p = computePortfolio(cars, entries, '2026-03-03', 12)
    expect(p.aportes.map((a) => [a.date, a.amountCents])).toEqual([['2026-01-01', 101_000], ['2026-02-01', 12_500]])
    expect(p.caixa).toBe(0)
    expect(p.receber).toBe(0)
    expect(p.estoque).toBe(120_000)
    expect(p.lucro).toBe(6_500)
    expect(p.start?.amountCents).toBe(101_000)
  })
  it('venda ainda não acertada vira "a receber"; sobra vira caixa', () => {
    const cars = [car({ name: 'A', purchaseDate: '2026-01-01', myPaid: 100_000, sold: true, saleDate: '2026-02-01', mySettlement: 110_000, myRealProfit: 10_000 })]
    const p = computePortfolio(cars, [], '2026-02-01', 12)
    expect(p.receber).toBe(110_000)
    expect(p.valorAtual).toBe(110_000)
    expect(p.lucro).toBe(10_000)
    expect(p.receberItems).toEqual([{ name: 'A', amountCents: 110_000 }])
  })
})

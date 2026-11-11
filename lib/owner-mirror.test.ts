import { describe, expect, it } from 'vitest'
import { ownerMirrorRows } from './owner-mirror'
import { computePortfolio } from './portfolio'
import type { OwnerCar } from './personal'

const car = (o: Partial<OwnerCar>): OwnerCar => ({
  vehicleId: o.name ?? 'x', name: 'x', version: '', year: '', sold: false, saleDate: null, myPaid: 0, myReceived: 0, myOwnCosts: 0,
  myProfitShare: null, myRealProfit: null, mySettlement: null, capitalEmpatado: null, purchaseDate: null, saleAmount: null,
  totalProfit: null, days: null, monthlyPct: null, myOwnCostItems: [], ...o,
})

describe('espelho do meu financeiro', () => {
  it('gera um resumo e uma linha por carro, sem os itens do tooltip', () => {
    const cars = [
      car({ vehicleId: 'v1', name: 'A', purchaseDate: '2026-01-01', myPaid: 100_000, sold: true, saleDate: '2026-02-01', mySettlement: 110_000, myRealProfit: 10_000 }),
      car({ vehicleId: 'v2', name: 'B', purchaseDate: '2026-02-10', myPaid: 50_000, capitalEmpatado: 50_000, myOwnCostItems: [{ label: 'x', amountCents: 1 }] }),
    ]
    const p = computePortfolio(cars, [], '2026-03-01', 12)
    const rows = ownerMirrorRows('u1', cars, p, '2026-03-01')
    expect(rows.map((r) => r.item_id)).toEqual(['resumo', 'carro:v1', 'carro:v2'])
    expect(rows.every((r) => r.owner_id === 'u1')).toBe(true)
    expect(rows[0].data.valorAtual).toBe(p.valorAtual)
    expect(rows[0].data.estoque).toBe(50_000)
    expect(rows[2].data.capitalEmpatado).toBe(50_000)
    expect('myOwnCostItems' in rows[2].data).toBe(false)
  })
})

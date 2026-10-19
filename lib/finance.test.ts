import { describe, expect, it } from 'vitest'
import { computeFinance, DEFAULT_FINANCE_CONFIG, emptyVehicleFinance, formatBRL, parseBRL, SALE_DEDUCTED, SPLIT_EQUAL } from './finance'

const partners = DEFAULT_FINANCE_CONFIG.partners

describe('parseBRL', () => {
  it('aceita variações', () => {
    expect(parseBRL('85.000,50')).toBe(8500050)
    expect(parseBRL('85000')).toBe(8500000)
    expect(parseBRL('85.000')).toBe(8500000)
    expect(parseBRL('85000,5')).toBe(8500050)
    expect(parseBRL('R$ 1.234,56')).toBe(123456)
    expect(parseBRL('')).toBeNull()
    expect(parseBRL('abc')).toBeNull()
  })
})

describe('formatBRL', () => {
  it('formata em pt-BR', () => {
    expect(formatBRL(8500050)).toBe('R$ 85.000,50')
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
})

describe('computeFinance', () => {
  it('lucro e margem', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase.amountCents = 10000000
    f.costs = [{ id: 'c1', category: 'manutencao', description: '', amountCents: 500000, date: null, paidBy: null }]
    f.sale.amountCents = 12000000
    const r = computeFinance(f, partners)
    expect(r.totalInvested).toBe(10500000)
    expect(r.profit).toBe(1500000)
    expect(r.marginPct).toBeCloseTo(12.5)
    expect(r.roiPct).toBeCloseTo(14.2857, 3)
    expect(r.costsByCategory.manutencao).toBe(500000)
  })

  it('sem venda não tem lucro', () => {
    const r = computeFinance(emptyVehicleFinance('v1'), partners)
    expect(r.profit).toBeNull()
    expect(r.marginPct).toBeNull()
  })

  it('divide centavo ímpar sem perder nada', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase.amountCents = 100
    f.sale.amountCents = 201
    const r = computeFinance(f, partners)
    expect(r.profit).toBe(101)
    expect(r.perPartner[0].share).toBe(51)
    expect(r.perPartner[1].share).toBe(50)
  })

  it('acerto entre sócios', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase = { amountCents: 10000000, date: null, paidBy: 'p1', note: '' }
    f.costs = [{ id: 'c1', category: 'outros', description: '', amountCents: 500000, date: null, paidBy: 'p2' }]
    f.sale = { amountCents: 12000000, date: null, receivedBy: 'p1', note: '' }
    const r = computeFinance(f, partners)
    expect(r.profit).toBe(1500000)
    expect(r.perPartner.map((p) => p.share)).toEqual([750000, 750000])
    expect(r.perPartner[0].settlement).toBe(-1250000)
    expect(r.perPartner[1].settlement).toBe(1250000)
  })

  it('compra metade cada e taxa descontada da venda', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase = { amountCents: 10000000, date: null, paidBy: SPLIT_EQUAL, note: '' }
    f.costs = [
      { id: 'c1', category: 'auto_avaliar', description: '', amountCents: 200000, date: null, paidBy: SALE_DEDUCTED },
      { id: 'c2', category: 'transporte', description: '', amountCents: 300000, date: null, paidBy: SPLIT_EQUAL },
    ]
    f.sale = { amountCents: 12000000, date: null, receivedBy: 'p1', note: '' }
    const r = computeFinance(f, partners)
    // lucro = 120.000 − 100.000 − 2.000 − 3.000 = 15.000
    expect(r.profit).toBe(1500000)
    expect(r.saleNet).toBe(11800000)
    // cada um pagou 50.000 + 1.500; p1 recebeu 118.000 líquido
    expect(r.perPartner[0].paid).toBe(5150000)
    expect(r.perPartner[1].paid).toBe(5150000)
    expect(r.perPartner[0].received).toBe(11800000)
    // p1: 51.500 + 7.500 − 118.000 = −59.000 (repassa ao Élcio) ; p2: 51.500 + 7.500 = +59.000
    expect(r.perPartner[0].settlement).toBe(-5900000)
    expect(r.perPartner[1].settlement).toBe(5900000)
  })

  it('venda recebida metade cada', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase = { amountCents: 10000000, date: null, paidBy: SPLIT_EQUAL, note: '' }
    f.sale = { amountCents: 12000000, date: null, receivedBy: SPLIT_EQUAL, note: '' }
    const r = computeFinance(f, partners)
    expect(r.perPartner.map((p) => p.settlement)).toEqual([0, 0])
  })

  it('custo não dividido: fora do lucro e do acerto, cobrado só de quem pagou', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase = { amountCents: 6300000, date: null, paidBy: 'p1', note: '' }
    f.costs = [
      { id: 'c1', category: 'auto_avaliar', description: '', amountCents: 100000, date: null, paidBy: 'p1', shared: false },
      { id: 'c2', category: 'comissao', description: '', amountCents: 150000, date: null, paidBy: 'p1', shared: true },
      { id: 'c3', category: 'outros', description: '', amountCents: 790522, date: null, paidBy: 'p1' },
    ]
    f.sale = { amountCents: 8690000, date: null, receivedBy: 'p1', note: '' }
    const r = computeFinance(f, partners)
    expect(r.totalInvested).toBe(6300000 + 100000 + 150000 + 790522)
    expect(r.sharedCostsTotal).toBe(940522)
    expect(r.ownCostsTotal).toBe(100000)
    expect(r.profit).toBe(1449478)
    expect(r.perPartner.map((p) => p.share)).toEqual([724739, 724739])
    expect(r.perPartner[0].ownCosts).toBe(100000)
    expect(r.perPartner[0].realProfit).toBe(624739)
    expect(r.perPartner[1].realProfit).toBe(724739)
    // p1 pagou 63.000 + 9.405,22 (sem a taxa); recebeu 86.900 → deve 7.247,39 ao Élcio
    expect(r.perPartner[0].paid).toBe(7240522)
    expect(r.perPartner[0].settlement).toBe(-724739)
    expect(r.perPartner[1].settlement).toBe(724739)
  })

  it('custo descontado da venda é sempre dividido', () => {
    const f = emptyVehicleFinance('v1')
    f.purchase = { amountCents: 10000000, date: null, paidBy: 'p1', note: '' }
    f.costs = [{ id: 'c1', category: 'auto_avaliar', description: '', amountCents: 200000, date: null, paidBy: SALE_DEDUCTED, shared: false }]
    f.sale = { amountCents: 12000000, date: null, receivedBy: 'p1', note: '' }
    const r = computeFinance(f, partners)
    expect(r.profit).toBe(1800000)
    expect(r.ownCostsTotal).toBe(0)
  })
})

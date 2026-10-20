import { describe, expect, it } from 'vitest'
import { DEFAULT_FINANCE_CONFIG, emptyVehicleFinance, formatBRL } from './finance'
import { buildImport, historicalId } from './personal-import'
import { defaultDirection, ledgerTotals, ownerCarSummary, ownerTotals, settlementText, withRunningBalance, type LedgerEntry } from './personal'

const partners = DEFAULT_FINANCE_CONFIG.partners

const entry = (p: Partial<LedgerEntry>): LedgerEntry => ({
  id: 'x', date: '2026-10-01', type: 'outro', description: '', amountCents: 0, direction: 'saida', vehicleRef: '', note: '', ...p,
})

function soldCar() {
  const f = emptyVehicleFinance('v1', { name: 'Kia Sorento', version: '', year: '2014' })
  f.purchase = { amountCents: 6300000, date: null, paidBy: 'p1', note: '' }
  f.costs = [
    { id: 'c1', category: 'auto_avaliar', description: '', amountCents: 100000, date: null, paidBy: 'p1', shared: false },
    { id: 'c2', category: 'comissao', description: '', amountCents: 150000, date: null, paidBy: 'p1' },
    { id: 'c3', category: 'outros', description: '', amountCents: 790522, date: null, paidBy: 'p1' },
  ]
  f.sale = { amountCents: 8690000, date: '2026-10-15', receivedBy: 'p1', note: '' }
  return f
}

describe('ledger', () => {
  it('totais e saldo', () => {
    const t = ledgerTotals([entry({ direction: 'entrada', amountCents: 1000 }), entry({ amountCents: 400 }), entry({ amountCents: 100 })])
    expect(t).toEqual({ entradas: 1000, saidas: 500, saldo: 500 })
  })

  it('saldo acumulado cronológico, mais recente primeiro', () => {
    const rows = withRunningBalance([
      entry({ id: 'b', date: '2026-10-05', direction: 'saida', amountCents: 300 }),
      entry({ id: 'a', date: '2026-10-01', direction: 'entrada', amountCents: 1000 }),
    ])
    expect(rows.map((r) => r.id)).toEqual(['b', 'a'])
    expect(rows.map((r) => r.balance)).toEqual([700, 1000])
  })

  it('sentido padrão', () => {
    expect(defaultDirection('aporte')).toBe('saida')
    expect(defaultDirection('recebimento')).toBe('entrada')
    expect(defaultDirection('outro')).toBeNull()
  })
})

describe('ownerCarSummary', () => {
  it('carro vendido: parte, custos só meus, lucro real e acerto', () => {
    const [c] = ownerCarSummary([soldCar()], partners)
    expect(c.sold).toBe(true)
    expect(c.myPaid).toBe(6300000 + 150000 + 790522)
    expect(c.myOwnCosts).toBe(100000)
    expect(c.myProfitShare).toBe(724739)
    expect(c.myRealProfit).toBe(624739)
    expect(c.mySettlement).toBe(-724739) // recebi tudo: devo a parte do Élcio
    expect(c.capitalEmpatado).toBeNull()
  })

  it('carro em estoque: capital empatado', () => {
    const f = emptyVehicleFinance('v2', { name: 'Compass' })
    f.purchase = { amountCents: 5000000, date: null, paidBy: 'p1', note: '' }
    f.costs = [{ id: 'c', category: 'manutencao', description: '', amountCents: 200000, date: null, paidBy: 'p2' }]
    const [c] = ownerCarSummary([f], partners)
    expect(c.sold).toBe(false)
    expect(c.capitalEmpatado).toBe(5000000)
    expect(c.myProfitShare).toBeNull()
    expect(c.mySettlement).toBeNull()
    expect(ownerTotals([c], []).capitalEmpatado).toBe(5000000)
  })
})

describe('ownerTotals / acerto', () => {
  const cars = ownerCarSummary([soldCar()], partners)

  it('totais de lucro e acerto', () => {
    const t = ownerTotals(cars, [])
    expect(t.lucroRecebido).toBe(724739)
    expect(t.lucroReal).toBe(624739)
    expect(t.acertoAberto).toBe(-724739)
  })

  it('saída de acerto (eu paguei o sócio) reduz o que devo', () => {
    const t = ownerTotals(cars, [entry({ type: 'acerto_socio', direction: 'saida', amountCents: 500000 })])
    expect(t.acertoAberto).toBe(-224739)
  })

  it('entrada de acerto (sócio me pagou) reduz o que ele me deve', () => {
    const credit = ownerCarSummary([{ ...soldCar(), sale: { amountCents: 8690000, date: '2026-10-15', receivedBy: 'p2', note: '' } }], partners)
    const base = ownerTotals(credit, [])
    expect(base.acertoAberto).toBeGreaterThan(0)
    const t = ownerTotals(credit, [entry({ type: 'acerto_socio', direction: 'entrada', amountCents: 100000 })])
    expect(t.acertoAberto).toBe(base.acertoAberto - 100000)
  })

  it('ignora entradas que não são acerto', () => {
    expect(ownerTotals(cars, [entry({ type: 'pagamento', amountCents: 999 })]).acertoAberto).toBe(-724739)
  })

  it('textos do acerto', () => {
    expect(settlementText(1000, 'Élcio', formatBRL)).toBe('Élcio te deve R$ 10,00')
    expect(settlementText(-1000, 'Élcio', formatBRL)).toBe('Você deve ao Élcio R$ 10,00')
    expect(settlementText(0, 'Élcio', formatBRL)).toBe('Quites')
  })
})

describe('buildImport', () => {
  it('importa movimentações e carros, resolvendo sócios por nome', () => {
    const r = buildImport(
      {
        movimentacoes: [{ data: '2026-10-19', tipo: 'pagamento', descricao: 'Reparo', valor: '12.547,39', carro: 'Sorento' }],
        carros: [{
          nome: 'Kia Sorento', ano: '2014', placa: 'OGF-0B59',
          compra: { valor: '63.000,00', data: '2026-09-20', pagoPor: 'fabrício' },
          custos: [{ categoria: 'auto_avaliar', descricao: 'Taxa', valor: 1000, pagoPor: 'Fabricio', dividir: false }, { valor: '100', pagoPor: 'Descontado da venda' }],
          venda: { valor: '86.900,00', data: '2026-10-15', recebidoPor: 'ÉLCIO' },
        }],
      },
      partners,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.entries[0]).toMatchObject({ amountCents: 1254739, direction: 'saida', vehicleRef: 'Sorento' })
    const f = r.cars[0].finance
    expect(f.purchase).toMatchObject({ amountCents: 6300000, paidBy: 'p1', note: 'Placa OGF-0B59' })
    expect(f.costs[0]).toMatchObject({ amountCents: 100000, shared: false, paidBy: 'p1' })
    expect(f.costs[1].paidBy).toBe('venda')
    expect(f.sale.receivedBy).toBe('p2')
  })

  it('rejeita sócio desconhecido, valor inválido e direção ausente', () => {
    const r = buildImport(
      {
        movimentacoes: [{ data: '2026-10-19', tipo: 'outro', descricao: 'x', valor: 'abc' }, { data: '2026-10-19', tipo: 'outro', descricao: 'x', valor: 5 }],
        carros: [{ nome: 'A', compra: { valor: 1, pagoPor: 'Fulano' } }],
      },
      partners,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toHaveLength(3)
  })

  it('id histórico seguro', () => {
    expect(historicalId('Kia Sorento 2014!', () => 'ab12')).toBe('hist-kia-sorento-2014-ab12')
  })
})

import { carKey, entryKey } from './personal-import'
describe('chaves de deduplicação', () => {
  it('carKey ignora acento, caixa e espaços', () => {
    expect(carKey('  Hyundai  Santa Fé ')).toBe(carKey('hyundai santa fe'))
  })
  it('entryKey igual para a mesma movimentação', () => {
    const e = { date: '2026-10-19', type: 'acerto_socio', direction: 'entrada', amountCents: 4665261, description: 'Sorento branca' }
    expect(entryKey(e)).toBe(entryKey({ ...e, description: 'sorento  branca' }))
    expect(entryKey(e)).not.toBe(entryKey({ ...e, amountCents: 1 }))
  })
})

import { daysBetween, monthlyReturnPct } from './personal'
describe('prazo e rendimento', () => {
  it('dias entre compra e venda', () => {
    expect(daysBetween('2026-06-26', '2026-08-17')).toBe(52)
    expect(daysBetween('2026-08-17', '2026-06-26')).toBeNull()
    expect(daysBetween(null, '2026-08-17')).toBeNull()
  })
  it('% ao mês simples sobre o capital', () => {
    expect(monthlyReturnPct(3000, 100000, 30)).toBeCloseTo(3)
    expect(monthlyReturnPct(3000, 100000, 60)).toBeCloseTo(1.5)
    expect(monthlyReturnPct(null, 100000, 30)).toBeNull()
  })
})

/**
 * Cópia do "Meu financeiro" em tabela (suv_meu_espelho), para o painel de patrimônio.
 * Puro, sem I/O: monta as linhas a partir do que a página já calculou.
 * Valores continuam em CENTAVOS, como no resto do código; as visões do banco convertem para reais.
 */
import type { OwnerCar } from './personal'
import type { Portfolio } from './portfolio'

export const OWNER_SUMMARY_ID = 'resumo'

export interface OwnerMirrorRow {
  owner_id: string
  item_id: string
  tipo: 'resumo' | 'carro'
  data: Record<string, unknown>
}

export function ownerMirrorRows(ownerId: string, cars: OwnerCar[], portfolio: Portfolio, today: string): OwnerMirrorRow[] {
  const resumo: OwnerMirrorRow = {
    owner_id: ownerId,
    item_id: OWNER_SUMMARY_ID,
    tipo: 'resumo',
    data: {
      date: today,
      caixa: portfolio.caixa,
      receber: portfolio.receber,
      estoque: portfolio.estoque,
      estoqueCount: portfolio.estoqueCount,
      valorAtual: portfolio.valorAtual,
      totalAportes: portfolio.totalAportes,
      retiradas: portfolio.retiradas,
      lucro: portfolio.lucro,
      lucroPct: portfolio.lucroPct,
      monthlyPct: portfolio.monthlyPct,
    },
  }
  const carros: OwnerMirrorRow[] = cars.map((c) => ({
    owner_id: ownerId,
    item_id: `carro:${c.vehicleId}`,
    tipo: 'carro',
    data: {
      vehicleId: c.vehicleId,
      name: c.name,
      version: c.version,
      year: c.year,
      sold: c.sold,
      purchaseDate: c.purchaseDate,
      saleDate: c.saleDate,
      myPaid: c.myPaid,
      myOwnCosts: c.myOwnCosts,
      myReceived: c.myReceived,
      saleAmount: c.saleAmount,
      totalProfit: c.totalProfit,
      myProfitShare: c.myProfitShare,
      myRealProfit: c.myRealProfit,
      mySettlement: c.mySettlement,
      capitalEmpatado: c.capitalEmpatado,
      days: c.days,
      monthlyPct: c.monthlyPct,
    },
  }))
  return [resumo, ...carros]
}

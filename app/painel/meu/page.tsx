import Link from 'next/link'
import { after } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { formatBRL, monthLabel, monthOf } from '@/lib/finance'
import { getFinanceConfig } from '@/lib/finance-store'
import { getLedger, getOwnerCars, mirrorOwnerSnapshot } from '@/lib/personal-store'
import { getCdiAnnual } from '@/lib/cdi'
import { computePortfolio, type Portfolio } from '@/lib/portfolio'
import {
  ENTRY_SHORT,
  inMonth,
  ownerCarSummary,
  ownerTotals,
  settlementText,
  withRunningBalance,
  ledgerTotals,
  type OwnerCar,
} from '@/lib/personal'
import { SubmitButton } from '@/components/painel/submit-button'
import { deleteEntry } from './actions'
import { EntryForm } from './entry-form'

export const dynamic = 'force-dynamic'

/** Partes do "eu": o dono é sempre o sócio p1. */
const OWNER_PARTNER_ID = 'p1'

const todayBR = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
const tone = (n: number | null) => (n == null || n === 0 ? '' : n > 0 ? 'text-emerald-400' : 'text-red-400')
const money = (n: number | null | undefined) => (n == null ? '—' : formatBRL(n))
const fmtDate = (d: string) => d.split('-').reverse().join('/')
const pct = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`)

function Period({ c }: { c: OwnerCar }) {
  if (!c.purchaseDate) return <>—</>
  const short = (d: string) => fmtDate(d).slice(0, 5)
  if (!c.sold) return <>{short(c.purchaseDate)} → hoje{c.days != null && <> · <span className="text-text">{c.days} dias</span></>}</>
  return <>{short(c.purchaseDate)} → {c.saleDate ? short(c.saleDate) : '?'}{c.days != null && <> · <span className="text-text">{c.days} dias</span></>}</>
}

/** Valor após as taxas, com um tooltip (passar o mouse ou tocar) listando as taxas que só eu paguei. */
function AfterFees({ c }: { c: OwnerCar }) {
  if (c.myRealProfit == null) return <>—</>
  if (!c.myOwnCostItems.length) return <>{formatBRL(c.myRealProfit)}</>
  return (
    <span tabIndex={0} className="group relative inline-flex cursor-help items-center gap-1 outline-none">
      {formatBRL(c.myRealProfit)}
      <span aria-hidden className="text-[11px] text-muted">ⓘ</span>
      <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded-lg border border-gold bg-black p-3 text-left text-xs text-text shadow-xl group-hover:block group-focus:block">
        <span className="mb-1 block text-muted">Minha metade {formatBRL(c.myProfitShare ?? 0)}, menos as taxas que só eu paguei:</span>
        {c.myOwnCostItems.map((t, i) => (
          <span key={i} className="flex justify-between gap-3"><span>{t.label}</span><span className="tabular-nums">− {formatBRL(t.amountCents)}</span></span>
        ))}
        <span className="mt-1 flex justify-between gap-3 border-t border-white/10 pt-1 font-medium"><span>Ficou pra mim</span><span className="tabular-nums">{formatBRL(c.myRealProfit)}</span></span>
      </span>
    </span>
  )
}

const pct2 = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`)

/** Ícone ⓘ com explicação ao passar o mouse ou tocar. */
function Tip({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <span tabIndex={0} className="group relative ml-1 inline-block cursor-help align-middle text-[11px] text-muted outline-none">
      ⓘ
      <span role="tooltip" className={`pointer-events-none absolute top-full z-20 mt-2 hidden w-72 rounded-lg border border-gold bg-black p-3 text-left text-xs normal-case tracking-normal text-text shadow-xl group-hover:block group-focus:block ${align === 'right' ? 'right-0' : 'left-0'}`}>
        {children}
      </span>
    </span>
  )
}

function Carteira({ p, cdi, partner }: { p: Portfolio; cdi: { pct: number; date: string | null; source: string }; partner: string }) {
  if (!p.start) return null
  const box = 'rounded-xl border border-gold bg-coal p-4'
  const label = 'text-[11px] uppercase tracking-wider text-muted'
  const beat = p.monthlyPct != null ? p.monthlyPct - p.cdiMonthlyNetPct : null
  const line = (k: string, v: number, cls = '') => (
    <span className="flex justify-between gap-3"><span>{k}</span><span className={`tabular-nums ${cls}`}>{formatBRL(v)}</span></span>
  )
  return (
    <section className="mt-6">
      <h2 className="font-display text-gold text-lg">Minha carteira</h2>
      <p className="mt-1 text-xs text-muted">
        Desde {fmtDate(p.start.date)} ({p.days} dias). Calculada sozinha a partir dos carros e das movimentações.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={box}>
          <p className={label}>Comecei com</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatBRL(p.start.amountCents)}</p>
          <p className="mt-1 text-xs text-muted">{p.start.car}, {fmtDate(p.start.date)}</p>
        </div>
        <div className={box}>
          <p className={label}>
            Saiu do meu bolso
            <Tip>
              <span className="mb-1 block text-muted">Cada carro usa primeiro o dinheiro que voltou de vendas; o que faltou saiu do bolso:</span>
              {p.aportes.map((a, i) => (
                <span key={i} className="flex justify-between gap-3"><span>{fmtDate(a.date).slice(0, 5)} · {a.cars.join(', ') || 'Despesa'}</span><span className="tabular-nums">{formatBRL(a.amountCents)}</span></span>
              ))}
              <span className="mt-1 flex justify-between gap-3 border-t border-white/10 pt-1 font-medium"><span>Total</span><span className="tabular-nums">{formatBRL(p.totalAportes)}</span></span>
            </Tip>
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatBRL(p.totalAportes)}</p>
          <p className="mt-1 text-xs text-muted">{p.aportes.length} aportes{p.retiradas ? ` · retirei ${formatBRL(p.retiradas)}` : ''}</p>
        </div>
        <div className={box}>
          <p className={label}>
            Tenho hoje
            <Tip align="right">
              {line(`Carros em estoque (${p.estoqueCount}), pelo custo`, p.estoque)}
              {line('Caixa (já voltou, não reinvestido)', p.caixa)}
              {p.receberItems.map((r, i) => (
                <span key={i} className="flex justify-between gap-3">
                  <span>{r.amountCents > 0 ? `${partner} me deve` : `Devo ao ${partner}`} · {r.name}</span>
                  <span className={`tabular-nums ${r.amountCents > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.amountCents > 0 ? '' : '− '}{formatBRL(Math.abs(r.amountCents))}</span>
                </span>
              ))}
              <span className="mt-1 flex justify-between gap-3 border-t border-white/10 pt-1 font-medium"><span>Total</span><span className="tabular-nums">{formatBRL(p.valorAtual)}</span></span>
            </Tip>
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatBRL(p.valorAtual)}</p>
          <p className="mt-1 text-xs text-muted">
            Carros {formatBRL(p.estoque)} · caixa {formatBRL(p.caixa)}
            {p.receber ? <> · {p.receber > 0 ? 'a receber' : 'a pagar'} {formatBRL(Math.abs(p.receber))}</> : null}
          </p>
        </div>
        <div className={box}>
          <p className={label}>Lucro até agora</p>
          <p className={`mt-1 text-xl font-semibold tabular-nums ${tone(p.lucro)}`}>{formatBRL(p.lucro)}</p>
          <p className="mt-1 text-xs text-muted">{pct(p.lucroPct)} sobre o que saiu do bolso</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className={box}>
          <p className={label}>
            Rendimento ao mês
            <Tip>
              Lucro ÷ dinheiro investido, pesando cada aporte pelos dias em que ficou aplicado. Carros em estoque entram pelo que custaram — o lucro deles só conta quando venderem, então este número sobe a cada venda.
            </Tip>
          </p>
          <div className="mt-2 flex items-baseline gap-6">
            <div>
              <p className={`text-2xl font-semibold tabular-nums ${tone(p.monthlyPct)}`}>{pct2(p.monthlyPct)}</p>
              <p className="text-xs text-muted">Rei do SUV</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-muted">{pct2(p.cdiMonthlyNetPct)}</p>
              <p className="text-xs text-muted">CDI líquido (−{p.irPct.toLocaleString('pt-BR')}% de IR)</p>
              <p className="text-[11px] text-muted">bruto {pct2(p.cdiMonthlyPct)} · {cdi.pct.toLocaleString('pt-BR')}% a.a.{cdi.source === 'bcb' ? '' : ', estimado'}</p>
            </div>
          </div>
          {beat != null && (
            <p className={`mt-2 text-sm ${beat >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {beat >= 0 ? `${pct2(beat)} ao mês acima do CDI líquido` : `${pct2(-beat)} ao mês abaixo do CDI líquido`}
            </p>
          )}
        </div>
        <div className={box}>
          <p className={label}>
            Comparado ao CDI (líquido)
            <Tip align="right">
              <span className="mb-1 block">Quanto os mesmos aportes, nas mesmas datas, teriam rendido no CDI até hoje, já descontado o imposto de renda da renda fixa (CDB, Tesouro), que cai com o tempo:</span>
              <span className="flex justify-between"><span>até 6 meses</span><span>22,5%</span></span>
              <span className="flex justify-between"><span>6 meses a 1 ano</span><span>20%</span></span>
              <span className="flex justify-between"><span>1 a 2 anos</span><span>17,5%</span></span>
              <span className="flex justify-between"><span>mais de 2 anos</span><span>15%</span></span>
            </Tip>
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Meu lucro</dt><dd className={`text-right tabular-nums ${tone(p.lucro)}`}>{formatBRL(p.lucro)}</dd>
            <dt className="text-muted">No CDI, já sem o IR</dt><dd className="text-right tabular-nums">{formatBRL(p.cdiGainNet)}</dd>
            <dt className="text-[11px] text-muted">(bruto, antes do IR)</dt><dd className="text-right text-[11px] tabular-nums text-muted">{formatBRL(p.cdiGain)}</dd>
            <dt className="text-muted">Diferença</dt>
            <dd className={`text-right font-medium tabular-nums ${tone(p.lucro - p.cdiGainNet)}`}>{p.lucro - p.cdiGainNet >= 0 ? '+' : '−'} {formatBRL(Math.abs(p.lucro - p.cdiGainNet))}</dd>
          </dl>
        </div>
      </div>
    </section>
  )
}

export default async function MeuFinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string; ok?: string; erro?: string }> }) {
  const { user } = await requireOwner()
  const { mes, ok, erro } = await searchParams
  const [config, finances, ledger, cdi] = await Promise.all([getFinanceConfig(), getOwnerCars(user.id), getLedger(user.id), getCdiAnnual()])

  const partner = config.partners.find((p) => p.id !== OWNER_PARTNER_ID)?.name ?? 'Sócio'
  const allCars = ownerCarSummary(finances, config.partners, OWNER_PARTNER_ID)
  const portfolio = computePortfolio(allCars, ledger.entries, todayBR(), cdi.pct)
  // cópia em tabela para o painel de patrimônio (depois da resposta, não atrasa a página)
  after(() => mirrorOwnerSnapshot(user.id, allCars, portfolio, todayBR()))
  const rowsAll = withRunningBalance(ledger.entries) // saldo acumulado sobre TODO o histórico

  const months = [
    ...new Set([
      ...allCars.map((c) => monthOf(c.saleDate)),
      ...ledger.entries.map((e) => monthOf(e.date)),
    ].filter((m): m is string => !!m)),
  ].sort().reverse()
  const period = mes && months.includes(mes) ? mes : ''

  // Filtro de mês: carros vendidos pela data da venda (em estoque sempre aparecem) e movimentações pela data.
  const cars = allCars.filter((c) => !c.sold || inMonth(c.saleDate, period))
  const rows = rowsAll.filter((e) => inMonth(e.date, period))
  const periodTotals = ownerTotals(cars, rows)
  const ledgerSum = ledgerTotals(rows)
  // O acerto com o sócio vale para todo o histórico (não depende do filtro).
  const settlementAll = ownerTotals(allCars, ledger.entries).acertoAberto

  const kpi = 'rounded-xl border border-gold bg-coal p-4'
  const kpiLabel = 'text-[11px] uppercase tracking-wider text-muted'
  const num = 'text-right tabular-nums'
  const carNames = [...new Set(allCars.map((c) => c.name).filter(Boolean))]
  const sortedCars = [...cars].sort((a, b) => Number(a.sold) - Number(b.sold) || (b.saleDate ?? '').localeCompare(a.saleDate ?? ''))

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-gold text-2xl">Meu financeiro</h1>
          <p className="mt-1 text-xs text-muted">🔒 Só você vê esta área</p>
        </div>
        <Link href="/painel/meu/importar" className="btn-ghost rounded-xl px-4 py-2 text-sm">Importar histórico</Link>
      </div>

      {ok && <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{ok === '2' ? 'Movimentação removida.' : 'Movimentação lançada.'}</p>}
      {erro && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}

      <Carteira p={portfolio} cdi={cdi} partner={partner} />

      <form method="get" className="mt-10 flex items-end gap-2">
        <div>
          <label className="label" htmlFor="mes">Período</label>
          <select id="mes" name="mes" defaultValue={period} className="field">
            <option value="">Todos</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <button className="btn-ghost rounded-lg px-4 py-2.5 text-sm">Filtrar</button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={kpi}>
          <p className={kpiLabel}>Lucro total (carros vendidos)</p>
          <p className={`mt-2 text-xl font-semibold tabular-nums ${tone(periodTotals.lucroReal)}`}>{formatBRL(periodTotals.lucroReal)}</p>
          <p className="mt-1 text-xs text-muted">Minha parte {formatBRL(periodTotals.lucroRecebido)}, já descontados custos só meus</p>
        </div>
        <div className={kpi}>
          <p className={kpiLabel}>Capital empatado em estoque</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{formatBRL(periodTotals.capitalEmpatado)}</p>
        </div>
        <div className={kpi}>
          <p className={kpiLabel}>Acerto com o {partner}</p>
          <p className={`mt-2 text-lg font-semibold ${tone(settlementAll)}`}>{settlementText(settlementAll, partner, formatBRL)}</p>
          <p className="mt-1 text-xs text-muted">Todo o histórico, já abatidos os acertos lançados</p>
        </div>
        <div className={kpi}>
          <p className={kpiLabel}>Saldo das movimentações</p>
          <p className={`mt-2 text-xl font-semibold tabular-nums ${tone(ledgerSum.saldo)}`}>{formatBRL(ledgerSum.saldo)}</p>
          <p className="mt-1 text-xs text-muted">Entradas {formatBRL(ledgerSum.entradas)} · saídas {formatBRL(ledgerSum.saidas)}</p>
        </div>
      </div>

      <h2 className="font-display text-gold mt-10 text-lg">Por carro</h2>
      {sortedCars.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nenhum carro com dados financeiros{period ? ' neste período' : ''}.</p>
      ) : (
        <>
          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-gold bg-coal md:block xl:overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 text-left font-normal">Carro</th>
                  <th className="px-3 py-3 text-left font-normal">Compra → venda</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Eu coloquei</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Venda</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Lucro total</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Minha metade</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Pra mim após taxas</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>% ao mês</th>
                  <th className={`px-3 py-3 font-normal ${num}`}>Acerto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedCars.map((c) => (
                  <tr key={c.vehicleId}>
                    <td className="px-4 py-3">
                      <span className="font-medium">{c.name}</span> <span className="text-muted">{[c.version, c.year].filter(Boolean).join(' · ')}</span>
                      {!c.sold && <span className="ml-2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">Em estoque</span>}
                    </td>
                    <td className="px-3 py-3 text-muted"><Period c={c} /></td>
                    <td className={`px-3 py-3 ${num}`}>{formatBRL(c.myPaid + c.myOwnCosts)}</td>
                    <td className={`px-3 py-3 ${num}`}>{money(c.saleAmount)}</td>
                    <td className={`px-3 py-3 ${num} ${tone(c.totalProfit)}`}>{money(c.totalProfit)}</td>
                    <td className={`px-3 py-3 ${num} ${tone(c.myProfitShare)}`}>{money(c.myProfitShare)}</td>
                    <td className={`px-3 py-3 ${num} ${tone(c.myRealProfit)}`}><AfterFees c={c} /></td>
                    <td className={`px-3 py-3 ${num} ${tone(c.monthlyPct)}`}>{pct(c.monthlyPct)}</td>
                    <td className={`px-3 py-3 ${num} ${tone(c.mySettlement)}`}>
                      {c.mySettlement == null ? '—' : c.mySettlement === 0 ? 'Quites' : c.mySettlement > 0 ? `${partner} deve ${formatBRL(c.mySettlement)}` : `Devo ${formatBRL(-c.mySettlement)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 hidden text-xs text-muted md:block">% ao mês = quanto ficou pra mim após as taxas ÷ o que eu coloquei no carro, dividido pelos meses entre a compra e a venda.</p>

          <ul className="mt-3 space-y-3 md:hidden">
            {sortedCars.map((c) => (
              <li key={c.vehicleId} className="rounded-xl border border-gold bg-coal p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-medium">{c.name} <span className="text-muted">{c.version}</span></p>
                  <span className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">{c.sold ? 'Vendido' : 'Em estoque'}</span>
                </div>
                <p className="mt-1 text-xs text-muted"><Period c={c} /></p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">Eu coloquei</dt><dd className={num}>{formatBRL(c.myPaid + c.myOwnCosts)}</dd>
                  {c.sold && (
                    <>
                      <dt className="text-muted">Venda</dt><dd className={num}>{money(c.saleAmount)}</dd>
                      <dt className="text-muted">Lucro total</dt><dd className={`${num} ${tone(c.totalProfit)}`}>{money(c.totalProfit)}</dd>
                      <dt className="text-muted">Minha metade</dt><dd className={`${num} ${tone(c.myProfitShare)}`}>{money(c.myProfitShare)}</dd>
                      <dt className="text-muted">Pra mim após taxas</dt><dd className={`${num} ${tone(c.myRealProfit)}`}><AfterFees c={c} /></dd>
                      <dt className="text-muted">% ao mês</dt><dd className={`${num} ${tone(c.monthlyPct)}`}>{pct(c.monthlyPct)}</dd>
                    </>
                  )}
                  <dt className="text-muted">Acerto</dt>
                  <dd className={`${num} ${tone(c.mySettlement)}`}>
                    {c.mySettlement == null ? '—' : settlementText(c.mySettlement, partner, formatBRL)}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="font-display text-gold mt-10 text-lg">Minhas movimentações</h2>
      <section className="mt-3 rounded-xl border border-gold bg-coal p-5">
        <EntryForm today={todayBR()} mes={period} carNames={carNames} />
      </section>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nenhuma movimentação{period ? ' neste período' : ''}.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/5 rounded-xl border border-gold bg-coal">
          {rows.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.description}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {fmtDate(e.date)} · {ENTRY_SHORT[e.type]}{e.vehicleRef ? ` · ${e.vehicleRef}` : ''}
                </p>
                {e.note && <p className="mt-0.5 text-xs text-muted">{e.note}</p>}
              </div>
              <div className="flex shrink-0 items-start gap-3">
                <div className="text-right tabular-nums">
                  <p className={`text-sm font-semibold ${e.direction === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {e.direction === 'entrada' ? '+' : '−'} {formatBRL(e.amountCents)}
                  </p>
                  <p className="text-xs text-muted">saldo {formatBRL(e.balance)}</p>
                </div>
                <form action={deleteEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="mes" value={period} />
                  <SubmitButton className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-red-300 hover:border-red-400/50" pendingText="…">Excluir</SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

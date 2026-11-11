-- =====================================================================
-- Rei do SUV: cópia do "Meu financeiro" em tabela (para o painel de patrimônio)
-- O site continua gravando os arquivos JSON privados; esta tabela é um espelho
-- que o servidor regrava ao abrir /painel/meu. Só o service role lê e escreve.
-- Valores guardados em centavos; as visões entregam em reais.
-- Idempotente: pode rodar de novo sem quebrar nada.
-- =====================================================================

create table if not exists public.suv_meu_espelho (
  owner_id   text not null,               -- id do usuário dono (Supabase Auth)
  item_id    text not null,               -- 'resumo' ou 'carro:<id do carro>'
  tipo       text not null check (tipo in ('resumo', 'carro')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, item_id)
);

alter table public.suv_meu_espelho enable row level security;
revoke all on public.suv_meu_espelho from anon, authenticated;

-- Resumo da carteira de carros (o mesmo topo da página Meu financeiro)
create or replace view public.suv_meu_resumo
with (security_invoker = true) as
select
  e.owner_id,
  nullif(e.data ->> 'date', '')                         as data_ref,
  round((e.data ->> 'valorAtual')::numeric / 100, 2)   as valor_atual,
  round((e.data ->> 'caixa')::numeric / 100, 2)        as caixa,
  round((e.data ->> 'receber')::numeric / 100, 2)      as a_receber_socio,
  round((e.data ->> 'estoque')::numeric / 100, 2)      as estoque,
  (e.data ->> 'estoqueCount')::int                      as carros_em_estoque,
  round((e.data ->> 'totalAportes')::numeric / 100, 2) as total_aportes,
  round((e.data ->> 'retiradas')::numeric / 100, 2)    as retiradas,
  round((e.data ->> 'lucro')::numeric / 100, 2)        as lucro,
  round((e.data ->> 'lucroPct')::numeric, 2)            as lucro_pct,
  round((e.data ->> 'monthlyPct')::numeric, 2)          as rendimento_mes_pct,
  e.updated_at
from public.suv_meu_espelho e
where e.tipo = 'resumo';

-- Um carro por linha, já com a minha parte
create or replace view public.suv_meu_carros
with (security_invoker = true) as
select
  e.owner_id,
  e.data ->> 'vehicleId'                                        as vehicle_id,
  coalesce(nullif(e.data ->> 'name', ''), 'Veículo')            as carro,
  nullif(e.data ->> 'version', '')                              as versao,
  nullif(e.data ->> 'year', '')                                 as ano,
  case when (e.data ->> 'sold')::boolean then 'vendido' else 'em estoque' end as status,
  nullif(e.data ->> 'purchaseDate', '')                         as data_compra,
  nullif(e.data ->> 'saleDate', '')                             as data_venda,
  round((e.data ->> 'myPaid')::numeric / 100, 2)                as meu_investido,
  round((e.data ->> 'myOwnCosts')::numeric / 100, 2)            as custos_so_meus,
  round((e.data ->> 'saleAmount')::numeric / 100, 2)            as venda,
  round((e.data ->> 'totalProfit')::numeric / 100, 2)           as lucro_total,
  round((e.data ->> 'myProfitShare')::numeric / 100, 2)         as minha_parte_lucro,
  round((e.data ->> 'myRealProfit')::numeric / 100, 2)          as meu_lucro_real,
  round((e.data ->> 'mySettlement')::numeric / 100, 2)          as acerto_socio,
  round((e.data ->> 'capitalEmpatado')::numeric / 100, 2)       as capital_empatado,
  (e.data ->> 'days')::int                                      as dias,
  round((e.data ->> 'monthlyPct')::numeric, 2)                  as rendimento_mes_pct,
  e.updated_at
from public.suv_meu_espelho e
where e.tipo = 'carro';

revoke all on public.suv_meu_resumo from anon, authenticated;
revoke all on public.suv_meu_carros from anon, authenticated;

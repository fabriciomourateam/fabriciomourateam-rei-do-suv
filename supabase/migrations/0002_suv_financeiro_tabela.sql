-- =====================================================================
-- Rei do SUV — cópia do financeiro em tabela (para relatórios e painéis)
-- O site continua gravando os arquivos JSON no bucket privado; esta tabela
-- é um espelho que o servidor atualiza a cada salvamento e ao abrir
-- /painel/financeiro. Só o service role lê e escreve (RLS sem políticas).
-- Idempotente: pode rodar de novo sem quebrar nada.
-- =====================================================================

create table if not exists public.suv_finance (
  vehicle_id text primary key,          -- id do carro, ou '_config' para os sócios
  data       jsonb not null,            -- o mesmo JSON salvo no bucket
  updated_at timestamptz not null default now()
);

alter table public.suv_finance enable row level security;
revoke all on public.suv_finance from anon, authenticated;

-- Resumo por carro, em reais. Lucro = venda − compra − custos divididos
-- (mesma regra de computeFinance em lib/finance.ts).
create or replace view public.suv_financeiro_resumo
with (security_invoker = true) as
with cfg as (
  select coalesce(
    (select (p ->> 'pct')::numeric
       from public.suv_finance f, jsonb_array_elements(f.data -> 'partners') p
      where f.vehicle_id = '_config' and p ->> 'id' = 'p1'
      limit 1),
    50) as pct_p1
),
base as (
  select
    f.vehicle_id,
    f.data,
    (f.data #>> '{purchase,amountCents}')::numeric / 100 as compra,
    nullif(f.data #>> '{purchase,date}', '')        as data_compra,
    (f.data #>> '{sale,amountCents}')::numeric / 100 as venda,
    nullif(f.data #>> '{sale,date}', '')            as data_venda,
    coalesce((select sum((c ->> 'amountCents')::numeric)
                from jsonb_array_elements(coalesce(f.data -> 'costs', '[]')) c), 0) / 100 as custos,
    coalesce((select sum((c ->> 'amountCents')::numeric)
                from jsonb_array_elements(coalesce(f.data -> 'costs', '[]')) c
               where coalesce((c ->> 'shared')::boolean, true) or c ->> 'paidBy' = 'venda'), 0) / 100 as custos_divididos
  from public.suv_finance f
  where f.vehicle_id <> '_config'
)
select
  b.vehicle_id,
  coalesce(nullif(trim(concat_ws(' ', v.brand, v.model)), ''), b.data #>> '{snapshot,name}', 'Veículo') as carro,
  coalesce(v.version, b.data #>> '{snapshot,version}')                                                  as versao,
  coalesce(v.status, case when b.venda is not null then 'vendido' else 'disponivel' end)              as status,
  b.data_compra,
  round(b.compra, 2)                                                                                             as compra,
  round(b.custos, 2)                                                                                             as custos,
  round(b.compra + b.custos, 2)                                                                                  as total_investido,
  b.data_venda,
  round(b.venda, 2)                                                                                              as venda,
  case when b.venda is not null then round(b.venda - b.compra - b.custos_divididos, 2) end                       as lucro,
  case when b.venda is not null then round((b.venda - b.compra - b.custos_divididos) * cfg.pct_p1 / 100, 2) end as lucro_fabricio
from base b
cross join cfg
left join public.suv_vehicles v on v.id::text = b.vehicle_id;

revoke all on public.suv_financeiro_resumo from anon, authenticated;

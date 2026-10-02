-- =====================================================================
-- Rei do SUV — estrutura completa (rodar 1x no SQL Editor do Supabase)
-- Tudo com prefixo suv_ para conviver com outras tabelas do mesmo projeto.
-- Idempotente: pode rodar de novo sem quebrar nada.
-- =====================================================================

-- ---------- Admins do painel ----------
create table if not exists public.suv_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create or replace function public.suv_is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.suv_admins where user_id = auth.uid())
$$;

-- ---------- Veículos ----------
create table if not exists public.suv_vehicles (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  brand            text not null,
  model            text not null,
  version          text,
  engine           text,
  drivetrain       text,
  year_manufacture int,
  year_model       int,
  km               int,
  color            text,
  transmission     text,
  fuel             text,
  seats            int,
  highlights       text[] not null default '{}',
  headline         text,
  description      text,
  status           text not null default 'disponivel' check (status in ('disponivel','reservado','vendido')),
  visible          boolean not null default true,
  featured         boolean not null default false,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.suv_photos (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.suv_vehicles(id) on delete cascade,
  url        text not null,
  sort_order int not null default 0
);
create index if not exists suv_photos_vehicle_idx on public.suv_photos(vehicle_id, sort_order);

-- ---------- Configurações do site (linha única) ----------
create table if not exists public.suv_config (
  id            int primary key default 1 check (id = 1),
  whatsapp      text,
  instagram     text,
  tiktok        text,
  city          text,
  address_note  text,
  hours         text,
  hero_title    text,
  hero_subtitle text
);
insert into public.suv_config (id, whatsapp, city, address_note, hours)
values (1, '5511953965259', 'São Paulo · SP', 'Atendimento com hora marcada', 'Seg a Sáb · 9h às 19h')
on conflict (id) do nothing;

-- ---------- Cliques no WhatsApp (interesse por carro) ----------
create table if not exists public.suv_clicks (
  id         bigint generated always as identity primary key,
  vehicle_id uuid references public.suv_vehicles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists suv_clicks_created_idx on public.suv_clicks(created_at);

-- ---------- RLS ----------
alter table public.suv_admins   enable row level security;
alter table public.suv_vehicles enable row level security;
alter table public.suv_photos   enable row level security;
alter table public.suv_config   enable row level security;
alter table public.suv_clicks   enable row level security;

drop policy if exists suv_admins_read  on public.suv_admins;
drop policy if exists suv_admins_write on public.suv_admins;
create policy suv_admins_read  on public.suv_admins for select to authenticated using (public.suv_is_admin());
create policy suv_admins_write on public.suv_admins for all    to authenticated using (public.suv_is_admin()) with check (public.suv_is_admin());

drop policy if exists suv_vehicles_public on public.suv_vehicles;
drop policy if exists suv_vehicles_admin  on public.suv_vehicles;
create policy suv_vehicles_public on public.suv_vehicles for select using (visible or public.suv_is_admin());
create policy suv_vehicles_admin  on public.suv_vehicles for all to authenticated using (public.suv_is_admin()) with check (public.suv_is_admin());

drop policy if exists suv_photos_public on public.suv_photos;
drop policy if exists suv_photos_admin  on public.suv_photos;
create policy suv_photos_public on public.suv_photos for select using (true);
create policy suv_photos_admin  on public.suv_photos for all to authenticated using (public.suv_is_admin()) with check (public.suv_is_admin());

drop policy if exists suv_config_public on public.suv_config;
drop policy if exists suv_config_admin  on public.suv_config;
create policy suv_config_public on public.suv_config for select using (true);
create policy suv_config_admin  on public.suv_config for all to authenticated using (public.suv_is_admin()) with check (public.suv_is_admin());

drop policy if exists suv_clicks_insert on public.suv_clicks;
drop policy if exists suv_clicks_admin  on public.suv_clicks;
create policy suv_clicks_insert on public.suv_clicks for insert with check (true);
create policy suv_clicks_admin  on public.suv_clicks for select to authenticated using (public.suv_is_admin());

-- ---------- Storage: bucket público para fotos ----------
insert into storage.buckets (id, name, public)
values ('suv-veiculos', 'suv-veiculos', true)
on conflict (id) do update set public = true;

drop policy if exists suv_storage_read   on storage.objects;
drop policy if exists suv_storage_insert on storage.objects;
drop policy if exists suv_storage_update on storage.objects;
drop policy if exists suv_storage_delete on storage.objects;
create policy suv_storage_read   on storage.objects for select using (bucket_id = 'suv-veiculos');
create policy suv_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'suv-veiculos' and public.suv_is_admin());
create policy suv_storage_update on storage.objects for update to authenticated using (bucket_id = 'suv-veiculos' and public.suv_is_admin());
create policy suv_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'suv-veiculos' and public.suv_is_admin());

-- ---------- Primeiro admin ----------
-- Cria o usuário (se ainda não existir neste projeto) e o torna admin do Rei do SUV.
-- >>> ANTES DE RODAR: troque DEFINA_A_SENHA pela senha do primeiro acesso (mínimo 6 caracteres). <<<
do $$
declare
  v_email text := 'fabriciomouratreinador@gmail.com';
  v_pass  text := 'DEFINA_A_SENHA';
  v_id    uuid;
begin
  if v_pass = 'DEFINA_A_SENHA' or length(v_pass) < 6 then
    raise exception 'Defina a senha do primeiro acesso na variável v_pass antes de rodar.';
  end if;
  select id into v_id from auth.users where email = v_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_pass, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
            'email', now(), now(), now());
  end if;
  insert into public.suv_admins (user_id, email) values (v_id, v_email) on conflict (user_id) do nothing;
end $$;

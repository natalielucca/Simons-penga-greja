create extension if not exists pgcrypto;

create table if not exists public.household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  created_at timestamptz not null default now()
);

create or replace function public.is_household_member()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where user_id = auth.uid()
  );
$$;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  text text not null,
  amount numeric(12, 2) not null,
  category text not null default 'unclear',
  suggested_category text not null default 'other',
  note text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, text, amount)
);

create table if not exists public.reflections (
  month text primary key,
  best_buy text not null default '',
  skip_buy text not null default '',
  surprise text not null default '',
  goal text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  month text not null,
  category text not null,
  amount numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (month, category)
);

create table if not exists public.app_settings (
  id text primary key default 'main',
  custom1 text not null default '',
  custom2 text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.household_members enable row level security;
alter table public.transactions enable row level security;
alter table public.reflections enable row level security;
alter table public.budgets enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "members can read members" on public.household_members;
create policy "members can read members"
on public.household_members
for select
using (public.is_household_member());

drop policy if exists "members can read transactions" on public.transactions;
create policy "members can read transactions"
on public.transactions
for select
using (public.is_household_member());

drop policy if exists "members can insert transactions" on public.transactions;
create policy "members can insert transactions"
on public.transactions
for insert
with check (public.is_household_member());

drop policy if exists "members can update transactions" on public.transactions;
create policy "members can update transactions"
on public.transactions
for update
using (public.is_household_member())
with check (public.is_household_member());

drop policy if exists "members can read reflections" on public.reflections;
create policy "members can read reflections"
on public.reflections
for select
using (public.is_household_member());

drop policy if exists "members can write reflections" on public.reflections;
create policy "members can write reflections"
on public.reflections
for all
using (public.is_household_member())
with check (public.is_household_member());

drop policy if exists "members can read budgets" on public.budgets;
create policy "members can read budgets"
on public.budgets
for select
using (public.is_household_member());

drop policy if exists "members can write budgets" on public.budgets;
create policy "members can write budgets"
on public.budgets
for all
using (public.is_household_member())
with check (public.is_household_member());

drop policy if exists "members can read settings" on public.app_settings;
create policy "members can read settings"
on public.app_settings
for select
using (public.is_household_member());

drop policy if exists "members can write settings" on public.app_settings;
create policy "members can write settings"
on public.app_settings
for all
using (public.is_household_member())
with check (public.is_household_member());

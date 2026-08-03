-- Ingresos generales, aparte de los registros diarios de Uber
create type income_type as enum (
  'sueldo',
  'venta',
  'freelance',
  'regalo',
  'reembolso',
  'otro'
);

create table incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type income_type not null default 'otro',
  amount numeric(12, 2) not null check (amount >= 0),
  income_date date not null,
  created_at timestamptz not null default now()
);

create index incomes_user_id_idx on incomes (user_id);

alter table incomes enable row level security;

create policy "incomes_select_own" on incomes for select using (auth.uid () = user_id);

create policy "incomes_insert_own" on incomes for insert
with
  check (auth.uid () = user_id);

create policy "incomes_update_own" on incomes
for update
  using (auth.uid () = user_id);

create policy "incomes_delete_own" on incomes for delete using (auth.uid () = user_id);

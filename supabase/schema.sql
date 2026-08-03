-- DailyGoal: gastos/deudas con cuotas + control de actividad Uber
-- Correr una vez en Supabase Dashboard -> SQL Editor -> Run

create extension if not exists pgcrypto;

create type debt_type as enum (
  'plan',
  'credito_consumo',
  'tarjeta_credito',
  'credito_hipotecario',
  'credito_automotriz',
  'prestado',
  'otro'
);

-- Deudas / gastos. total_installments = null significa "recurrente indefinido"
-- (ej. un plan o suscripción), en vez de un crédito/préstamo con fin fijo.
create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type debt_type not null default 'otro',
  amount numeric(12, 2) not null check (amount >= 0),
  due_day smallint not null check (due_day between 1 and 31),
  total_installments integer check (total_installments is null or total_installments > 0),
  installments_paid integer not null default 0 check (installments_paid >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index debts_user_id_idx on debts (user_id);

-- Historial de pagos: cada clic en "Nuevo pago" agrega una fila acá.
create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts (id) on delete cascade,
  installment_number integer not null,
  amount numeric(12, 2) not null,
  paid_at timestamptz not null default now()
);

create index debt_payments_debt_id_idx on debt_payments (debt_id);

-- Registro diario de actividad como conductor.
create table uber_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  km_driven numeric(8, 2) not null default 0 check (km_driven >= 0),
  earnings numeric(12, 2) not null default 0 check (earnings >= 0),
  fuel_liters numeric(8, 2) check (fuel_liters is null or fuel_liters >= 0),
  fuel_cost numeric(12, 2) check (fuel_cost is null or fuel_cost >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index uber_logs_user_id_idx on uber_logs (user_id);

-- Configuración por usuario. work_days: 0 = domingo ... 6 = sábado.
create table user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fuel_price_per_liter numeric(10, 2) not null default 0,
  km_per_liter numeric(6, 2) not null default 0,
  work_days smallint[] not null default '{1,2,3,4,5,6}',
  updated_at timestamptz not null default now()
);

-- Row Level Security: cada usuario solo ve y modifica sus propios datos.
alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table uber_logs enable row level security;
alter table user_settings enable row level security;

create policy "debts_select_own" on debts for select using (auth.uid () = user_id);

create policy "debts_insert_own" on debts for insert
with
  check (auth.uid () = user_id);

create policy "debts_update_own" on debts
for update
  using (auth.uid () = user_id);

create policy "debts_delete_own" on debts for delete using (auth.uid () = user_id);

create policy "debt_payments_select_own" on debt_payments for select using (
  exists (
    select 1
    from debts
    where
      debts.id = debt_payments.debt_id
      and debts.user_id = auth.uid ()
  )
);

create policy "debt_payments_insert_own" on debt_payments for insert
with
  check (
    exists (
      select 1
      from debts
      where
        debts.id = debt_payments.debt_id
        and debts.user_id = auth.uid ()
    )
  );

create policy "debt_payments_delete_own" on debt_payments for delete using (
  exists (
    select 1
    from debts
    where
      debts.id = debt_payments.debt_id
      and debts.user_id = auth.uid ()
  )
);

create policy "uber_logs_select_own" on uber_logs for select using (auth.uid () = user_id);

create policy "uber_logs_insert_own" on uber_logs for insert
with
  check (auth.uid () = user_id);

create policy "uber_logs_update_own" on uber_logs
for update
  using (auth.uid () = user_id);

create policy "uber_logs_delete_own" on uber_logs for delete using (auth.uid () = user_id);

create policy "user_settings_select_own" on user_settings for select using (auth.uid () = user_id);

create policy "user_settings_insert_own" on user_settings for insert
with
  check (auth.uid () = user_id);

create policy "user_settings_update_own" on user_settings
for update
  using (auth.uid () = user_id);

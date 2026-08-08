-- DailyGoal: gastos/deudas con cuotas + control de actividad Uber
-- Correr una vez en Supabase Dashboard -> SQL Editor -> Run

create extension if not exists pgcrypto;

-- Nota: este es el estado completo para un proyecto nuevo. Si tu base ya
-- tenía este tipo creado con menos valores, usa las migraciones en
-- supabase/migrations/ (ALTER TYPE ... ADD VALUE) en vez de este archivo.
create type debt_type as enum (
  'plan',
  'credito_consumo',
  'tarjeta_credito',
  'credito_hipotecario',
  'credito_automotriz',
  'prestado',
  'comida',
  'ahorro',
  'arriendo',
  'servicios_basicos',
  'salud',
  'transporte',
  'educacion',
  'entretenimiento',
  'mantencion_vehiculo',
  'otro'
);

-- Deudas / gastos. total_installments = null significa "recurrente indefinido"
-- (ej. un plan o suscripción), en vez de un crédito/préstamo con fin fijo.
-- installments_overdue: cuotas atrasadas, suma al monto pendiente y a la
-- meta diaria; "Nuevo pago" la descuenta primero cuando es > 0. Sube sola
-- cuando pasa un mes sin pago (ver reconcileOverdueInstallments en
-- manage-debts.ts); last_overdue_check marca hasta qué mes ya se revisó,
-- para no contar el mismo mes dos veces ni tocar meses previos a que el
-- gasto empezara a rastrearse (null = todavía no se ha revisado).
create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type debt_type not null default 'otro',
  amount numeric(12, 2) not null check (amount >= 0),
  due_day smallint not null check (due_day between 1 and 31),
  total_installments integer check (total_installments is null or total_installments > 0),
  installments_paid integer not null default 0 check (installments_paid >= 0),
  installments_overdue smallint not null default 0 check (installments_overdue >= 0),
  last_overdue_check date,
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

create type fuel_type as enum ('93', '95', '97', 'diesel', 'otro');

create type rideshare_platform as enum ('uber', 'didi', 'cabify', 'indriver', 'otro');

-- Registro de actividad como conductor. Puede haber más de uno por día
-- (turnos separados, ej. mañana y tarde con distinta plataforma) — el id
-- es la clave real de cada fila, no la fecha. fuel_cost queda nullable a
-- nivel de base (para no romper filas viejas), pero la app lo exige
-- siempre al guardar un registro nuevo. platforms es un arreglo (puede
-- trabajar con más de una app en el mismo turno).
create table uber_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  km_driven numeric(8, 2) not null default 0 check (km_driven >= 0),
  earnings_cash numeric(12, 2) not null default 0 check (earnings_cash >= 0),
  earnings_card numeric(12, 2) not null default 0 check (earnings_card >= 0),
  fuel_liters numeric(8, 2) check (fuel_liters is null or fuel_liters >= 0),
  fuel_cost numeric(12, 2) check (fuel_cost is null or fuel_cost >= 0),
  fuel_price_per_liter numeric(10, 2) check (
    fuel_price_per_liter is null
    or fuel_price_per_liter >= 0
  ),
  fuel_type fuel_type,
  trip_count smallint check (trip_count is null or trip_count >= 0),
  tips numeric(12, 2) check (tips is null or tips >= 0),
  platforms rideshare_platform[] not null default '{}',
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);

create index uber_logs_user_id_idx on uber_logs (user_id);
create index uber_logs_user_date_idx on uber_logs (user_id, log_date desc, start_time);

-- Suma los km desde la última mantención en el servidor (SQL), en vez de
-- traer todas las filas y sumarlas en JavaScript.
create or replace function km_since_maintenance(p_user_id uuid, p_since date)
returns numeric
language sql
stable
security invoker
as $$
  select coalesce(sum(km_driven), 0)
  from uber_logs
  where user_id = p_user_id
    and (p_since is null or log_date > p_since);
$$;

-- Configuración por usuario. work_days_mode: 'fixed_count' usa
-- work_days_per_month; 'automatic' lo ignora y reparte el mes completo
-- entre todos los días calendario que quedan, recalculando la meta diaria
-- según lo ya ganado.
-- Mantención: km_since_maintenance se calcula sumando uber_logs desde
-- last_maintenance_date (no es un contador propio), así que un registro
-- editado o borrado no lo desincroniza.
create table user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fuel_price_per_liter numeric(10, 2) not null default 0,
  km_per_liter numeric(6, 2) not null default 0,
  work_days_mode text not null default 'fixed_count' check (work_days_mode in ('fixed_count', 'automatic')),
  work_days_per_month smallint check (
    work_days_per_month is null
    or (
      work_days_per_month between 1 and 31
    )
  ),
  uber_mode_enabled boolean not null default true,
  maintenance_interval_km numeric(10, 2) check (
    maintenance_interval_km is null
    or maintenance_interval_km > 0
  ),
  last_maintenance_date date,
  biometric_lock_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Bloqueo biometrico (WebAuthn): la clave privada nunca sale del
-- dispositivo, aqui solo se guarda lo necesario para verificar la firma.
create table webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index webauthn_credentials_user_id_idx on webauthn_credentials (user_id);

-- Metas de ahorro con nombre propio. saved_amount es un aporte manual
-- (botón "Agregar aporte"), no se calcula solo desde Gastos/Ingresos.
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) check (target_amount is null or target_amount >= 0),
  target_date date,
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  created_at timestamptz not null default now()
);

create index savings_goals_user_id_idx on savings_goals (user_id);

-- Ingresos generales, aparte de los registros diarios de Uber.
create type income_type as enum (
  'sueldo',
  'venta',
  'freelance',
  'regalo',
  'reembolso',
  'ahorro',
  'otro'
);

-- income_date = null significa "recurrente" (ej. sueldo mensual), y en ese
-- caso payment_day (día del mes) reemplaza a la fecha única.
create table incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type income_type not null default 'otro',
  amount numeric(12, 2) not null check (amount >= 0),
  is_recurring boolean not null default false,
  income_date date,
  payment_day smallint check (
    payment_day is null
    or (
      payment_day between 1 and 31
    )
  ),
  created_at timestamptz not null default now(),
  constraint incomes_recurrence_shape check (
    (
      is_recurring = false
      and income_date is not null
      and payment_day is null
    )
    or (
      is_recurring = true
      and income_date is null
      and payment_day is not null
    )
  )
);

create index incomes_user_id_idx on incomes (user_id);

-- Row Level Security: cada usuario solo ve y modifica sus propios datos.
alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table uber_logs enable row level security;
alter table user_settings enable row level security;
alter table incomes enable row level security;
alter table savings_goals enable row level security;
alter table webauthn_credentials enable row level security;

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

create policy "incomes_select_own" on incomes for select using (auth.uid () = user_id);

create policy "incomes_insert_own" on incomes for insert
with
  check (auth.uid () = user_id);

create policy "incomes_update_own" on incomes
for update
  using (auth.uid () = user_id);

create policy "incomes_delete_own" on incomes for delete using (auth.uid () = user_id);

create policy "savings_goals_select_own" on savings_goals for select using (auth.uid () = user_id);

create policy "savings_goals_insert_own" on savings_goals for insert
with
  check (auth.uid () = user_id);

create policy "savings_goals_update_own" on savings_goals
for update
  using (auth.uid () = user_id);

create policy "savings_goals_delete_own" on savings_goals for delete using (auth.uid () = user_id);

create policy "webauthn_credentials_select_own" on webauthn_credentials for select using (auth.uid () = user_id);

create policy "webauthn_credentials_insert_own" on webauthn_credentials for insert
with
  check (auth.uid () = user_id);

create policy "webauthn_credentials_update_own" on webauthn_credentials
for update
  using (auth.uid () = user_id);

create policy "webauthn_credentials_delete_own" on webauthn_credentials for delete using (auth.uid () = user_id);

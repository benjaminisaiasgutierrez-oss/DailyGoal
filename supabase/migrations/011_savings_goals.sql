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

alter table savings_goals enable row level security;

create policy "savings_goals_select_own" on savings_goals for select using (auth.uid () = user_id);

create policy "savings_goals_insert_own" on savings_goals for insert
with
  check (auth.uid () = user_id);

create policy "savings_goals_update_own" on savings_goals
for update
  using (auth.uid () = user_id);

create policy "savings_goals_delete_own" on savings_goals for delete using (auth.uid () = user_id);

-- Traspasa la meta única existente (si había alguna) como una meta con
-- nombre, con el ahorrado ya calculado hasta ahora (misma fórmula que
-- calculateSavedAmount: pagos de gastos tipo "ahorro" + ingresos tipo
-- "ahorro"), para no perder el progreso ya hecho.
insert into
  savings_goals (
    user_id,
    name,
    target_amount,
    target_date,
    saved_amount
  )
select
  us.user_id,
  'Mi ahorro',
  us.savings_goal_amount,
  us.savings_goal_target_date,
  coalesce(
    (
      select sum(d.amount * d.installments_paid)
      from debts d
      where
        d.user_id = us.user_id
        and d.type = 'ahorro'
    ), 0
  ) + coalesce(
    (
      select sum(i.amount)
      from incomes i
      where
        i.user_id = us.user_id
        and i.type = 'ahorro'
    ), 0
  )
from user_settings us
where
  us.savings_goal_amount is not null;

alter table user_settings
drop column savings_goal_amount,
drop column savings_goal_target_date;

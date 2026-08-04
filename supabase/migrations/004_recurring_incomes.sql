-- Permite marcar un ingreso como recurrente (ej. sueldo mensual) en vez de
-- una fecha única. Recurrente usa payment_day (día del mes); fecha única
-- sigue usando income_date.
alter table incomes
add column is_recurring boolean not null default false,
add column payment_day smallint check (
  payment_day is null
  or (
    payment_day between 1 and 31
  )
);

alter table incomes
alter column income_date
drop not null;

alter table incomes add constraint incomes_recurrence_shape check (
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
);

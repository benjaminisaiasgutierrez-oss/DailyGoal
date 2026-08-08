-- Agrega el modo 'automatic' de días de trabajo: la meta diaria se
-- recalcula cada día según lo ganado hasta ayer y los días que quedan
-- del mes, en vez de un promedio fijo todo el mes.
do $$
declare
  found_constraint text;
begin
  select con.conname into found_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'user_settings'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%work_days_mode%';

  if found_constraint is not null then
    execute format('alter table user_settings drop constraint %I', found_constraint);
  end if;

  alter table user_settings add constraint user_settings_work_days_mode_check
    check (work_days_mode in ('weekdays', 'fixed_count', 'automatic'));
end $$;

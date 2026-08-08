-- Se elimina el modo 'weekdays': en la practica solo se usaban 'fixed_count'
-- y 'automatic', y la columna work_days ya no la lee ningun codigo.
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

  update user_settings set work_days_mode = 'fixed_count' where work_days_mode = 'weekdays';

  alter table user_settings add constraint user_settings_work_days_mode_check
    check (work_days_mode in ('fixed_count', 'automatic'));
end $$;

alter table user_settings drop column work_days;
alter table user_settings alter column work_days_mode set default 'fixed_count';

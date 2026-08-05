-- Permite más de un registro por día (turnos separados con distinto
-- horario/plataforma), quitando la restricción de unicidad por
-- (user_id, log_date). El id de cada fila sigue siendo su clave real;
-- guardar ya no hace upsert por fecha, y editar actualiza por id.
do $$
declare
  found_constraint text;
begin
  select con.conname into found_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'uber_logs' and con.contype = 'u';

  if found_constraint is not null then
    execute format('alter table uber_logs drop constraint %I', found_constraint);
  end if;
end $$;

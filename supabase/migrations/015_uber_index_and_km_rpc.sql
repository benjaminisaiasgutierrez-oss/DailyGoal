-- Cubre el patrón real de consulta de uber_logs (filtro por user_id +
-- rango de log_date, orden por log_date desc, start_time) que hoy solo
-- tenía el índice de una sola columna sobre user_id.
create index uber_logs_user_date_idx on uber_logs (user_id, log_date desc, start_time);

-- Suma los km desde la última mantención en el servidor, en vez de traer
-- todas las filas y sumarlas en JavaScript.
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

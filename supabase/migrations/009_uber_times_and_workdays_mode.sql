-- Hora de inicio/fin del día de trabajo Uber (ambas opcionales).
alter table uber_logs
add column start_time time,
add column end_time time;

-- Días de trabajo: por día de semana (como hoy) o cantidad fija al mes.
alter table user_settings
add column work_days_mode text not null default 'weekdays' check (
  work_days_mode in ('weekdays', 'fixed_count')
),
add column work_days_per_month smallint check (
  work_days_per_month is null
  or (
    work_days_per_month between 1 and 31
  )
);

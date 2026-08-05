create type fuel_type as enum ('93', '95', '97', 'diesel', 'otro');

create type rideshare_platform as enum ('uber', 'didi', 'cabify', 'indriver', 'otro');

alter table uber_logs
add column fuel_type fuel_type,
add column trip_count smallint check (trip_count is null or trip_count >= 0),
add column tips numeric(12, 2) check (tips is null or tips >= 0),
add column platforms rideshare_platform[] not null default '{}';

alter table user_settings
add column maintenance_interval_km numeric(10, 2) check (
  maintenance_interval_km is null
  or maintenance_interval_km > 0
),
add column last_maintenance_date date;

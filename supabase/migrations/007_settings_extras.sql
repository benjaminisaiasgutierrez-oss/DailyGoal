-- Modo Uber activable/desactivable y meta de ahorro (monto + fecha objetivo).
alter table user_settings
add column uber_mode_enabled boolean not null default true,
add column savings_goal_amount numeric(12, 2),
add column savings_goal_target_date date;

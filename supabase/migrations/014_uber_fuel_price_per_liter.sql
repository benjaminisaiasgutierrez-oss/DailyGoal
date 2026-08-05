alter table uber_logs
add column fuel_price_per_liter numeric(10, 2) check (
  fuel_price_per_liter is null
  or fuel_price_per_liter >= 0
);

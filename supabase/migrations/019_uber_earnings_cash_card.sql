-- Uber paga en efectivo al momento (el pasajero paga directo) y transfiere
-- lo cobrado con tarjeta cada semana. Separar el registro en dos montos
-- permite cuadrar ese pago semanal contra lo realmente cobrado con tarjeta.
alter table uber_logs add column earnings_cash numeric(12, 2) not null default 0 check (earnings_cash >= 0);
alter table uber_logs add column earnings_card numeric(12, 2) not null default 0 check (earnings_card >= 0);

update uber_logs set earnings_cash = earnings;

alter table uber_logs drop column earnings;

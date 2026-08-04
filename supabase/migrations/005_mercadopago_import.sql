-- Permite marcar qué ingresos vinieron de un pago de Mercado Pago
-- importado, para no duplicarlos si se vuelve a importar.
alter table incomes add column mercadopago_payment_id text;

create unique index incomes_user_mp_payment_unique on incomes (user_id, mercadopago_payment_id)
where
  mercadopago_payment_id is not null;

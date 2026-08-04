-- Se elimina la integración con Mercado Pago (columna y su índice único).
drop index if exists incomes_user_mp_payment_unique;

alter table incomes drop column if exists mercadopago_payment_id;

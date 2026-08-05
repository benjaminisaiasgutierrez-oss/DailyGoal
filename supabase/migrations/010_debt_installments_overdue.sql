alter table debts
add column installments_overdue smallint not null default 0 check (installments_overdue >= 0);

-- Marca hasta qué mes ya se revisó si el gasto quedó atrasado. Cuando es
-- null, la aplicación lo interpreta como "todavía no se ha revisado" y
-- arranca el conteo desde el mes actual (sin retroactividad).
alter table debts add column last_overdue_check date;

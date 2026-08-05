-- Agrega "ahorro" como categoría de Ingreso también (ya existía en Gastos),
-- para que la meta de ahorro pueda sumar desde ambos lados.
alter type income_type add value if not exists 'ahorro';

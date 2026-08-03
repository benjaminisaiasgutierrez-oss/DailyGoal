-- Agrega categorías de gasto general (no solo créditos con cuotas)
alter type debt_type add value if not exists 'comida';

alter type debt_type add value if not exists 'ahorro';

alter type debt_type add value if not exists 'arriendo';

alter type debt_type add value if not exists 'servicios_basicos';

alter type debt_type add value if not exists 'salud';

alter type debt_type add value if not exists 'transporte';

alter type debt_type add value if not exists 'educacion';

alter type debt_type add value if not exists 'entretenimiento';

alter type debt_type add value if not exists 'mantencion_vehiculo';

export const DEBT_TYPES = [
  "plan",
  "credito_consumo",
  "tarjeta_credito",
  "credito_hipotecario",
  "credito_automotriz",
  "prestado",
  "comida",
  "ahorro",
  "arriendo",
  "servicios_basicos",
  "salud",
  "transporte",
  "educacion",
  "entretenimiento",
  "mantencion_vehiculo",
  "otro",
] as const;

export type DebtType = (typeof DEBT_TYPES)[number];

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  plan: "Plan",
  credito_consumo: "Crédito de consumo",
  tarjeta_credito: "Tarjeta de crédito",
  credito_hipotecario: "Crédito hipotecario",
  credito_automotriz: "Crédito automotriz",
  prestado: "Prestado",
  comida: "Comida",
  ahorro: "Ahorro",
  arriendo: "Arriendo",
  servicios_basicos: "Servicios básicos",
  salud: "Salud",
  transporte: "Transporte",
  educacion: "Educación",
  entretenimiento: "Entretenimiento",
  mantencion_vehiculo: "Mantención del vehículo",
  otro: "Otro",
};

export type Debt = {
  id: string;
  userId: string;
  name: string;
  type: DebtType;
  amount: number;
  dueDay: number;
  totalInstallments: number | null;
  installmentsPaid: number;
  installmentsOverdue: number;
  active: boolean;
  createdAt: string;
};

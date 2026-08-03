export const DEBT_TYPES = [
  "plan",
  "credito_consumo",
  "tarjeta_credito",
  "credito_hipotecario",
  "credito_automotriz",
  "prestado",
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
  active: boolean;
  createdAt: string;
};

export type DebtPayment = {
  id: string;
  debtId: string;
  installmentNumber: number;
  amount: number;
  paidAt: string;
};

export const INCOME_TYPES = ["sueldo", "venta", "freelance", "regalo", "reembolso", "otro"] as const;

export type IncomeType = (typeof INCOME_TYPES)[number];

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  sueldo: "Sueldo",
  venta: "Venta",
  freelance: "Trabajo freelance / extra",
  regalo: "Regalo",
  reembolso: "Reembolso",
  otro: "Otro",
};

export type Income = {
  id: string;
  userId: string;
  name: string;
  type: IncomeType;
  amount: number;
  isRecurring: boolean;
  incomeDate: string | null;
  paymentDay: number | null;
  createdAt: string;
};

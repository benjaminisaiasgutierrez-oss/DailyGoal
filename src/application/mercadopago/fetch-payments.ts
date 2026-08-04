"use server";

import { verifySession } from "@/application/auth/get-session";
import { isMercadoPagoConfigured, mercadoPagoFetch } from "@/infrastructure/mercadopago/client";

export type MercadoPagoPayment = {
  id: number;
  amount: number;
  currency: string;
  description: string | null;
  operationType: string;
  dateApproved: string | null;
  payerEmail: string | null;
  payerName: string | null;
};

type MpUser = { id: number };

type MpPaymentRow = {
  id: number;
  status: string;
  transaction_amount: number;
  currency_id: string;
  description: string | null;
  operation_type: string;
  date_approved: string | null;
  collector_id: number;
  payer?: { email?: string | null; first_name?: string | null; last_name?: string | null };
};

type MpSearchResponse = { results: MpPaymentRow[] };

// Mercado Pago devuelve el tipo de operación en snake_case interno
// (ej. "money_exchange") — esto lo traduce a algo legible.
const MP_OPERATION_TYPE_LABELS: Record<string, string> = {
  regular_payment: "Pago",
  money_transfer: "Transferencia",
  recurring_payment: "Pago recurrente",
  account_fund: "Carga de saldo",
  money_exchange: "Cambio de moneda",
  pos_pay: "Pago en punto de venta",
  invoice: "Factura",
  withdraw: "Retiro",
  refund: "Reembolso",
  cellphone_recharge: "Recarga celular",
  payment_addition: "Pago adicional",
};

export function formatOperationType(operationType: string): string {
  return (
    MP_OPERATION_TYPE_LABELS[operationType] ??
    operationType.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

function mapPayment(row: MpPaymentRow): MercadoPagoPayment {
  const firstName = row.payer?.first_name?.trim();
  const lastName = row.payer?.last_name?.trim();
  const payerName = [firstName, lastName].filter(Boolean).join(" ") || null;

  return {
    id: row.id,
    amount: Number(row.transaction_amount),
    currency: row.currency_id,
    description: row.description,
    operationType: row.operation_type,
    dateApproved: row.date_approved,
    payerEmail: row.payer?.email ?? null,
    payerName,
  };
}

// Solo pagos donde el dueño de la cuenta es quien recibió el dinero
// (collector_id = su propio id) y que quedaron aprobados.
export async function getRecentReceivedPayments(limit = 20): Promise<MercadoPagoPayment[]> {
  await verifySession();

  if (!isMercadoPagoConfigured()) {
    throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN en .env.");
  }

  const me = await mercadoPagoFetch<MpUser>("/users/me");
  const search = await mercadoPagoFetch<MpSearchResponse>(
    `/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`
  );

  return search.results
    .filter((row) => row.collector_id === me.id && row.status === "approved")
    .map(mapPayment);
}

export async function getPaymentById(paymentId: number): Promise<MercadoPagoPayment> {
  await verifySession();
  const row = await mercadoPagoFetch<MpPaymentRow>(`/v1/payments/${paymentId}`);
  return mapPayment(row);
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";
import { mapDebt, mapDebtPayment } from "@/infrastructure/persistence/mappers";
import type { Debt, DebtPayment, DebtType } from "@/domain/entities/debt";

export async function getDebts(): Promise<Debt[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los gastos.");
  return (data ?? []).map(mapDebt);
}

// IDs de gastos que ya tienen al menos un pago registrado este mes —
// se usa para marcar cuáles quedaron "Atrasados".
export async function getDebtIdsPaidThisMonth(): Promise<Set<string>> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("debt_payments")
    .select("debt_id, debts!inner(user_id)")
    .eq("debts.user_id", userId)
    .gte("paid_at", firstOfMonth);

  if (error) throw new Error("No se pudo revisar el estado de los pagos.");
  return new Set((data ?? []).map((row) => row.debt_id as string));
}

export async function getDebtPayments(debtId: string): Promise<DebtPayment[]> {
  await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("debt_id", debtId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error("No se pudo cargar el historial de pagos.");
  return (data ?? []).map(mapDebtPayment);
}

export type DebtFormState = { error?: string } | undefined;

function parseDebtForm(formData: FormData):
  | {
      ok: true;
      value: {
        name: string;
        type: DebtType;
        amount: number;
        dueDay: number;
        totalInstallments: number | null;
        installmentsPaid: number;
        installmentsOverdue: number;
      };
    }
  | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "otro") as DebtType;
  const amount = Number(formData.get("amount"));
  const dueDay = Number(formData.get("dueDay"));
  const totalInstallmentsRaw = String(formData.get("totalInstallments") ?? "").trim();
  const totalInstallments = totalInstallmentsRaw ? Number(totalInstallmentsRaw) : null;
  const installmentsPaidRaw = String(formData.get("installmentsPaid") ?? "").trim();
  const installmentsPaid = installmentsPaidRaw ? Number(installmentsPaidRaw) : 0;
  const installmentsOverdueRaw = String(formData.get("installmentsOverdue") ?? "").trim();
  const installmentsOverdue = installmentsOverdueRaw ? Number(installmentsOverdueRaw) : 0;

  if (!name) return { ok: false, error: "Ingresa un nombre." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Ingresa un monto válido." };
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return { ok: false, error: "El día de pago debe estar entre 1 y 31." };
  }
  if (totalInstallments !== null && (!Number.isInteger(totalInstallments) || totalInstallments <= 0)) {
    return { ok: false, error: "La cantidad de cuotas debe ser un número mayor a 0, o déjalo vacío." };
  }
  if (!Number.isInteger(installmentsPaid) || installmentsPaid < 0) {
    return { ok: false, error: "Las cuotas pagadas deben ser un número de 0 o más." };
  }
  if (totalInstallments !== null && installmentsPaid > totalInstallments) {
    return { ok: false, error: "Las cuotas pagadas no pueden ser más que el total de cuotas." };
  }
  if (!Number.isInteger(installmentsOverdue) || installmentsOverdue < 0) {
    return { ok: false, error: "Las cuotas atrasadas deben ser un número de 0 o más." };
  }

  return {
    ok: true,
    value: { name, type, amount, dueDay, totalInstallments, installmentsPaid, installmentsOverdue },
  };
}

export async function createDebt(_prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const { userId } = await verifySession();
  const parsed = parseDebtForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("debts").insert({
    user_id: userId,
    name: parsed.value.name,
    type: parsed.value.type,
    amount: parsed.value.amount,
    due_day: parsed.value.dueDay,
    total_installments: parsed.value.totalInstallments,
    installments_paid: parsed.value.installmentsPaid,
    installments_overdue: parsed.value.installmentsOverdue,
  });

  if (error) return { error: "No se pudo guardar el gasto." };

  revalidatePath("/gastos");
  revalidatePath("/");
  return undefined;
}

export async function updateDebt(_prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Gasto no encontrado." };

  const parsed = parseDebtForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .update({
      name: parsed.value.name,
      type: parsed.value.type,
      amount: parsed.value.amount,
      due_day: parsed.value.dueDay,
      total_installments: parsed.value.totalInstallments,
      installments_paid: parsed.value.installmentsPaid,
      installments_overdue: parsed.value.installmentsOverdue,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: "No se pudo actualizar el gasto." };

  revalidatePath("/gastos");
  revalidatePath("/");
  return undefined;
}

export async function archiveDebt(debtId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("debts").update({ active: false }).eq("id", debtId).eq("user_id", userId);
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function deleteDebt(debtId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("debts").delete().eq("id", debtId).eq("user_id", userId);
  revalidatePath("/gastos");
  revalidatePath("/");
  revalidatePath("/ahorro");
}

export async function addPayment(debtId: string): Promise<{ error?: string }> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("installments_paid, total_installments, installments_overdue, amount")
    .eq("id", debtId)
    .eq("user_id", userId)
    .single();

  if (debtError || !debt) return { error: "Gasto no encontrado." };

  // Si hay cuotas atrasadas declaradas, el pago las descuenta primero
  // (y sigue sumando al conteo normal de cuotas pagadas).
  if (debt.installments_overdue > 0) {
    const nextInstallment = debt.installments_paid + 1;
    const stillFinished =
      debt.total_installments !== null && nextInstallment > debt.total_installments;

    const { error: paymentError } = await supabase.from("debt_payments").insert({
      debt_id: debtId,
      installment_number: nextInstallment,
      amount: debt.amount,
    });
    if (paymentError) return { error: "No se pudo registrar el pago." };

    const { error: updateError } = await supabase
      .from("debts")
      .update({
        installments_overdue: debt.installments_overdue - 1,
        installments_paid: stillFinished ? debt.installments_paid : nextInstallment,
      })
      .eq("id", debtId)
      .eq("user_id", userId);
    if (updateError) return { error: "El pago quedó registrado pero no se pudo actualizar el conteo." };

    revalidatePath("/gastos");
    revalidatePath("/");
    revalidatePath("/ahorro");
    return {};
  }

  if (debt.total_installments !== null && debt.installments_paid >= debt.total_installments) {
    return { error: "Este gasto ya está pagado por completo." };
  }

  const nextInstallment = debt.installments_paid + 1;

  const { error: paymentError } = await supabase.from("debt_payments").insert({
    debt_id: debtId,
    installment_number: nextInstallment,
    amount: debt.amount,
  });
  if (paymentError) return { error: "No se pudo registrar el pago." };

  const { error: updateError } = await supabase
    .from("debts")
    .update({ installments_paid: nextInstallment })
    .eq("id", debtId)
    .eq("user_id", userId);
  if (updateError) return { error: "El pago quedó registrado pero no se pudo actualizar el conteo." };

  revalidatePath("/gastos");
  revalidatePath("/");
  revalidatePath("/ahorro");
  return {};
}

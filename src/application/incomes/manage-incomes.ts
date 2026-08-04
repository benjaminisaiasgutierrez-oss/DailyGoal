"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";
import { mapIncome } from "@/infrastructure/persistence/mappers";
import type { Income, IncomeType } from "@/domain/entities/income";

export async function getIncomes(limit = 50): Promise<Income[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("No se pudieron cargar los ingresos.");
  return (data ?? []).map(mapIncome);
}

// Incluye los ingresos de fecha única dentro del rango, más TODOS los
// recurrentes (no tienen income_date — se repiten cada mes por definición).
export async function getIncomesInRange(startDate: string, endDate: string): Promise<Income[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .or(
      `is_recurring.eq.true,and(is_recurring.eq.false,income_date.gte.${startDate},income_date.lte.${endDate})`
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudieron cargar los ingresos.");
  return (data ?? []).map(mapIncome);
}

export type IncomeFormState = { error?: string } | undefined;

function parseIncomeForm(formData: FormData):
  | {
      ok: true;
      value: {
        name: string;
        type: IncomeType;
        amount: number;
        isRecurring: boolean;
        incomeDate: string | null;
        paymentDay: number | null;
      };
    }
  | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "otro") as IncomeType;
  const amount = Number(formData.get("amount"));
  const isRecurring = formData.get("isRecurring") === "on";

  if (!name) return { ok: false, error: "Ingresa un nombre." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Ingresa un monto válido." };

  if (isRecurring) {
    const paymentDay = Number(formData.get("paymentDay"));
    if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) {
      return { ok: false, error: "El día de pago debe estar entre 1 y 31." };
    }
    return { ok: true, value: { name, type, amount, isRecurring, incomeDate: null, paymentDay } };
  }

  const incomeDate = String(formData.get("incomeDate") ?? "");
  if (!incomeDate) return { ok: false, error: "Selecciona una fecha." };
  return { ok: true, value: { name, type, amount, isRecurring, incomeDate, paymentDay: null } };
}

export async function createIncome(
  _prev: IncomeFormState,
  formData: FormData
): Promise<IncomeFormState> {
  const { userId } = await verifySession();
  const parsed = parseIncomeForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("incomes").insert({
    user_id: userId,
    name: parsed.value.name,
    type: parsed.value.type,
    amount: parsed.value.amount,
    is_recurring: parsed.value.isRecurring,
    income_date: parsed.value.incomeDate,
    payment_day: parsed.value.paymentDay,
  });

  if (error) return { error: "No se pudo guardar el ingreso." };

  revalidatePath("/ingresos");
  revalidatePath("/");
  return undefined;
}

export async function updateIncome(
  _prev: IncomeFormState,
  formData: FormData
): Promise<IncomeFormState> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ingreso no encontrado." };

  const parsed = parseIncomeForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("incomes")
    .update({
      name: parsed.value.name,
      type: parsed.value.type,
      amount: parsed.value.amount,
      is_recurring: parsed.value.isRecurring,
      income_date: parsed.value.incomeDate,
      payment_day: parsed.value.paymentDay,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: "No se pudo actualizar el ingreso." };

  revalidatePath("/ingresos");
  revalidatePath("/");
  return undefined;
}

export async function deleteIncome(incomeId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("incomes").delete().eq("id", incomeId).eq("user_id", userId);
  revalidatePath("/ingresos");
  revalidatePath("/");
}

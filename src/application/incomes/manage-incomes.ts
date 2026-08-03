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
    .order("income_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error("No se pudieron cargar los ingresos.");
  return (data ?? []).map(mapIncome);
}

export async function getIncomesInRange(startDate: string, endDate: string): Promise<Income[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .gte("income_date", startDate)
    .lte("income_date", endDate)
    .order("income_date", { ascending: false });

  if (error) throw new Error("No se pudieron cargar los ingresos.");
  return (data ?? []).map(mapIncome);
}

export type IncomeFormState = { error?: string } | undefined;

function parseIncomeForm(formData: FormData):
  | { ok: true; value: { name: string; type: IncomeType; amount: number; incomeDate: string } }
  | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "otro") as IncomeType;
  const amount = Number(formData.get("amount"));
  const incomeDate = String(formData.get("incomeDate") ?? "");

  if (!name) return { ok: false, error: "Ingresa un nombre." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Ingresa un monto válido." };
  if (!incomeDate) return { ok: false, error: "Selecciona una fecha." };

  return { ok: true, value: { name, type, amount, incomeDate } };
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
    income_date: parsed.value.incomeDate,
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
      income_date: parsed.value.incomeDate,
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

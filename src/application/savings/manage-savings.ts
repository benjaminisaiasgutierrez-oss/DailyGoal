"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";
import { mapSavingsGoal } from "@/infrastructure/persistence/mappers";
import type { SavingsGoal } from "@/domain/entities/savings-goal";

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error("No se pudieron cargar las metas de ahorro.");
  return (data ?? []).map(mapSavingsGoal);
}

export type SavingsGoalFormState = { error?: string } | undefined;

function parseSavingsGoalForm(formData: FormData):
  | {
      ok: true;
      value: {
        name: string;
        targetAmount: number | null;
        targetDate: string | null;
        savedAmount: number;
      };
    }
  | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const targetAmountRaw = String(formData.get("targetAmount") ?? "").trim();
  const targetAmount = targetAmountRaw ? Number(targetAmountRaw) : null;
  const targetDate = String(formData.get("targetDate") ?? "").trim() || null;
  const savedAmountRaw = String(formData.get("savedAmount") ?? "").trim();
  const savedAmount = savedAmountRaw ? Number(savedAmountRaw) : 0;

  if (!name) return { ok: false, error: "Ingresa un nombre para la meta." };
  if (targetAmount !== null && (!Number.isFinite(targetAmount) || targetAmount <= 0)) {
    return { ok: false, error: "La meta debe ser un monto válido, o déjala vacía." };
  }
  if (!Number.isFinite(savedAmount) || savedAmount < 0) {
    return { ok: false, error: "Lo ahorrado debe ser un número de 0 o más." };
  }

  return { ok: true, value: { name, targetAmount, targetDate, savedAmount } };
}

export async function createSavingsGoal(
  _prev: SavingsGoalFormState,
  formData: FormData
): Promise<SavingsGoalFormState> {
  const { userId } = await verifySession();
  const parsed = parseSavingsGoalForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").insert({
    user_id: userId,
    name: parsed.value.name,
    target_amount: parsed.value.targetAmount,
    target_date: parsed.value.targetDate,
    saved_amount: parsed.value.savedAmount,
  });

  if (error) return { error: "No se pudo crear la meta." };

  revalidatePath("/ahorro");
  revalidatePath("/");
  return undefined;
}

export async function updateSavingsGoal(
  _prev: SavingsGoalFormState,
  formData: FormData
): Promise<SavingsGoalFormState> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Meta no encontrada." };

  const parsed = parseSavingsGoalForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("savings_goals")
    .update({
      name: parsed.value.name,
      target_amount: parsed.value.targetAmount,
      target_date: parsed.value.targetDate,
      saved_amount: parsed.value.savedAmount,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: "No se pudo actualizar la meta." };

  revalidatePath("/ahorro");
  revalidatePath("/");
  return undefined;
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("savings_goals").delete().eq("id", goalId).eq("user_id", userId);
  revalidatePath("/ahorro");
  revalidatePath("/");
}

export async function addContribution(
  _prev: SavingsGoalFormState,
  formData: FormData
): Promise<SavingsGoalFormState> {
  const { userId } = await verifySession();
  const goalId = String(formData.get("goalId") ?? "");
  const amount = Number(formData.get("amount"));

  if (!goalId) return { error: "Meta no encontrada." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Ingresa un monto válido." };

  const supabase = await createClient();
  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .select("saved_amount")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (goalError || !goal) return { error: "Meta no encontrada." };

  const { error } = await supabase
    .from("savings_goals")
    .update({ saved_amount: Number(goal.saved_amount) + amount })
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) return { error: "No se pudo registrar el aporte." };

  revalidatePath("/ahorro");
  revalidatePath("/");
  return undefined;
}

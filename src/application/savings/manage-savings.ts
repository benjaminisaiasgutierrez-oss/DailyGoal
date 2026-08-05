"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";

export type SavingsFormState = { error?: string } | undefined;

export async function updateSavingsGoal(
  _prev: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  const { userId } = await verifySession();

  const savingsGoalAmountRaw = String(formData.get("savingsGoalAmount") ?? "").trim();
  const savingsGoalTargetDateRaw = String(formData.get("savingsGoalTargetDate") ?? "").trim();

  const savingsGoalAmount = savingsGoalAmountRaw ? Number(savingsGoalAmountRaw) : null;
  if (
    savingsGoalAmount !== null &&
    (!Number.isFinite(savingsGoalAmount) || savingsGoalAmount <= 0)
  ) {
    return { error: "La meta de ahorro debe ser un monto válido." };
  }

  const savingsGoalTargetDate = savingsGoalTargetDateRaw || null;

  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      savings_goal_amount: savingsGoalAmount,
      savings_goal_target_date: savingsGoalTargetDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: "No se pudo guardar la meta de ahorro." };

  revalidatePath("/ahorro");
  revalidatePath("/");
  return undefined;
}

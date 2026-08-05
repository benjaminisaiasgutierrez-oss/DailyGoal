"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";
import { mapUberLog, mapUserSettings } from "@/infrastructure/persistence/mappers";
import type { UberLog } from "@/domain/entities/uber-log";
import { DEFAULT_WORK_DAYS, type UserSettings } from "@/domain/entities/user-settings";

export async function getUberLogs(limit = 30): Promise<UberLog[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("uber_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error("No se pudo cargar el historial de Uber.");
  return (data ?? []).map(mapUberLog);
}

export async function getUberLogsInRange(startDate: string, endDate: string): Promise<UberLog[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("uber_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (error) throw new Error("No se pudo cargar el historial de Uber.");
  return (data ?? []).map(mapUberLog);
}

export async function getUserSettings(): Promise<UserSettings> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la configuración.");
  if (!data) {
    return {
      userId,
      fuelPricePerLiter: 0,
      kmPerLiter: 0,
      workDays: DEFAULT_WORK_DAYS,
      workDaysMode: "weekdays",
      workDaysPerMonth: null,
      uberModeEnabled: true,
      savingsGoalAmount: null,
      savingsGoalTargetDate: null,
      updatedAt: new Date().toISOString(),
    };
  }
  return mapUserSettings(data);
}

export type UberFormState = { error?: string } | undefined;

export async function saveLog(_prev: UberFormState, formData: FormData): Promise<UberFormState> {
  const { userId } = await verifySession();

  const logDate = String(formData.get("logDate") ?? "");
  const kmDriven = Number(formData.get("kmDriven"));
  const earnings = Number(formData.get("earnings"));
  const fuelLitersRaw = String(formData.get("fuelLiters") ?? "").trim();
  const fuelCostRaw = String(formData.get("fuelCost") ?? "").trim();
  const fuelLiters = fuelLitersRaw ? Number(fuelLitersRaw) : null;
  const fuelCost = fuelCostRaw ? Number(fuelCostRaw) : NaN;
  const startTime = String(formData.get("startTime") ?? "").trim() || null;
  const endTime = String(formData.get("endTime") ?? "").trim() || null;

  if (!logDate) return { error: "Selecciona una fecha." };
  if (!Number.isFinite(kmDriven) || kmDriven < 0) return { error: "Ingresa los km recorridos." };
  if (!Number.isFinite(earnings) || earnings < 0) return { error: "Ingresa lo que ganaste ese día." };
  if (fuelLiters !== null && (!Number.isFinite(fuelLiters) || fuelLiters < 0)) {
    return { error: "Los litros cargados no son válidos." };
  }
  if (!Number.isFinite(fuelCost) || fuelCost < 0) {
    return { error: "Ingresa el costo de bencina cargada ese día." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("uber_logs").upsert(
    {
      user_id: userId,
      log_date: logDate,
      km_driven: kmDriven,
      earnings,
      fuel_liters: fuelLiters,
      fuel_cost: fuelCost,
      start_time: startTime,
      end_time: endTime,
    },
    { onConflict: "user_id,log_date" }
  );

  if (error) return { error: "No se pudo guardar el registro." };

  revalidatePath("/uber");
  revalidatePath("/");
  return undefined;
}

export async function deleteLog(logId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("uber_logs").delete().eq("id", logId).eq("user_id", userId);
  revalidatePath("/uber");
  revalidatePath("/");
}

export async function updateSettings(_prev: UberFormState, formData: FormData): Promise<UberFormState> {
  const { userId } = await verifySession();

  const fuelPricePerLiter = Number(formData.get("fuelPricePerLiter"));
  const kmPerLiter = Number(formData.get("kmPerLiter"));
  const workDaysMode = String(formData.get("workDaysMode") ?? "weekdays");
  const workDays = formData.getAll("workDays").map((value) => Number(value));
  const workDaysPerMonthRaw = String(formData.get("workDaysPerMonth") ?? "").trim();
  const workDaysPerMonth = workDaysPerMonthRaw ? Number(workDaysPerMonthRaw) : null;

  if (!Number.isFinite(fuelPricePerLiter) || fuelPricePerLiter < 0) {
    return { error: "Ingresa un precio de bencina válido." };
  }
  if (!Number.isFinite(kmPerLiter) || kmPerLiter < 0) {
    return { error: "Ingresa un rendimiento km/litro válido." };
  }
  if (workDaysMode !== "weekdays" && workDaysMode !== "fixed_count") {
    return { error: "Modo de días de trabajo inválido." };
  }
  if (workDaysMode === "weekdays" && workDays.length === 0) {
    return { error: "Selecciona al menos un día de trabajo." };
  }
  if (
    workDaysMode === "fixed_count" &&
    (workDaysPerMonth === null ||
      !Number.isFinite(workDaysPerMonth) ||
      workDaysPerMonth < 1 ||
      workDaysPerMonth > 31)
  ) {
    return { error: "Ingresa una cantidad de días al mes válida (1 a 31)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      fuel_price_per_liter: fuelPricePerLiter,
      km_per_liter: kmPerLiter,
      work_days: workDays.length > 0 ? workDays : DEFAULT_WORK_DAYS,
      work_days_mode: workDaysMode,
      work_days_per_month: workDaysMode === "fixed_count" ? workDaysPerMonth : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/uber");
  revalidatePath("/");
  return undefined;
}

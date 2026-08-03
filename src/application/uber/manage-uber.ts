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
  const fuelCost = fuelCostRaw ? Number(fuelCostRaw) : null;

  if (!logDate) return { error: "Selecciona una fecha." };
  if (!Number.isFinite(kmDriven) || kmDriven < 0) return { error: "Ingresa los km recorridos." };
  if (!Number.isFinite(earnings) || earnings < 0) return { error: "Ingresa lo que ganaste ese día." };
  if (fuelLiters !== null && (!Number.isFinite(fuelLiters) || fuelLiters < 0)) {
    return { error: "Los litros cargados no son válidos." };
  }
  if (fuelCost !== null && (!Number.isFinite(fuelCost) || fuelCost < 0)) {
    return { error: "El costo de bencina no es válido." };
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
  const workDays = formData.getAll("workDays").map((value) => Number(value));

  if (!Number.isFinite(fuelPricePerLiter) || fuelPricePerLiter < 0) {
    return { error: "Ingresa un precio de bencina válido." };
  }
  if (!Number.isFinite(kmPerLiter) || kmPerLiter < 0) {
    return { error: "Ingresa un rendimiento km/litro válido." };
  }
  if (workDays.length === 0) {
    return { error: "Selecciona al menos un día de trabajo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      fuel_price_per_liter: fuelPricePerLiter,
      km_per_liter: kmPerLiter,
      work_days: workDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/uber");
  revalidatePath("/");
  return undefined;
}

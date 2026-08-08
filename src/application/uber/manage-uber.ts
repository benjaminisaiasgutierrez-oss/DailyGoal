"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";
import { mapUberLog, mapUserSettings } from "@/infrastructure/persistence/mappers";
import { FUEL_TYPES, RIDESHARE_PLATFORMS, type UberLog } from "@/domain/entities/uber-log";
import {
  DEFAULT_WORK_DAYS,
  WORK_DAYS_MODES,
  type UserSettings,
  type WorkDaysMode,
} from "@/domain/entities/user-settings";
import { todayISO } from "@/lib/date";

export async function getUberLogs(limit = 30): Promise<UberLog[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("uber_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .order("start_time", { ascending: true, nullsFirst: true })
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
    .order("log_date", { ascending: false })
    .order("start_time", { ascending: true, nullsFirst: true });

  if (error) throw new Error("No se pudo cargar el historial de Uber.");
  return (data ?? []).map(mapUberLog);
}

export const getUserSettings = cache(async (): Promise<UserSettings> => {
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
      maintenanceIntervalKm: null,
      lastMaintenanceDate: null,
      updatedAt: new Date().toISOString(),
    };
  }
  return mapUserSettings(data);
});

export type UberFormState = { error?: string } | undefined;

function parseUberLogForm(formData: FormData):
  | {
      ok: true;
      value: {
        logDate: string;
        kmDriven: number;
        earnings: number;
        fuelLiters: number | null;
        fuelCost: number;
        fuelPricePerLiter: number | null;
        fuelType: string;
        tripCount: number | null;
        tips: number | null;
        platforms: string[];
        startTime: string | null;
        endTime: string | null;
      };
    }
  | { ok: false; error: string } {
  const logDate = String(formData.get("logDate") ?? "");
  const kmDriven = Number(formData.get("kmDriven"));
  const earnings = Number(formData.get("earnings"));
  const fuelLitersRaw = String(formData.get("fuelLiters") ?? "").trim();
  const fuelCostRaw = String(formData.get("fuelCost") ?? "").trim();
  const fuelLiters = fuelLitersRaw ? Number(fuelLitersRaw) : null;
  const fuelCost = fuelCostRaw ? Number(fuelCostRaw) : NaN;
  const fuelPricePerLiterRaw = String(formData.get("fuelPricePerLiter") ?? "").trim();
  const fuelPricePerLiter = fuelPricePerLiterRaw ? Number(fuelPricePerLiterRaw) : null;
  const fuelType = String(formData.get("fuelType") ?? "");
  const tripCountRaw = String(formData.get("tripCount") ?? "").trim();
  const tripCount = tripCountRaw ? Number(tripCountRaw) : null;
  const tipsRaw = String(formData.get("tips") ?? "").trim();
  const tips = tipsRaw ? Number(tipsRaw) : null;
  const platforms = formData.getAll("platforms").map((value) => String(value));
  const startTime = String(formData.get("startTime") ?? "").trim() || null;
  const endTime = String(formData.get("endTime") ?? "").trim() || null;

  if (!logDate) return { ok: false, error: "Selecciona una fecha." };
  if (!Number.isFinite(kmDriven) || kmDriven < 0) {
    return { ok: false, error: "Ingresa los km recorridos." };
  }
  if (!Number.isFinite(earnings) || earnings < 0) {
    return { ok: false, error: "Ingresa lo que ganaste ese día." };
  }
  if (fuelLiters !== null && (!Number.isFinite(fuelLiters) || fuelLiters < 0)) {
    return { ok: false, error: "Los litros cargados no son válidos." };
  }
  if (!Number.isFinite(fuelCost) || fuelCost < 0) {
    return { ok: false, error: "Ingresa cuánto gastaste en bencina ese día." };
  }
  if (
    fuelPricePerLiter !== null &&
    (!Number.isFinite(fuelPricePerLiter) || fuelPricePerLiter < 0)
  ) {
    return { ok: false, error: "El precio por litro no es válido." };
  }
  if (!FUEL_TYPES.includes(fuelType as (typeof FUEL_TYPES)[number])) {
    return { ok: false, error: "Selecciona qué tipo de bencina cargaste." };
  }
  if (tripCount !== null && (!Number.isInteger(tripCount) || tripCount < 0)) {
    return { ok: false, error: "El número de viajes no es válido." };
  }
  if (tips !== null && (!Number.isFinite(tips) || tips < 0)) {
    return { ok: false, error: "Las propinas no son válidas." };
  }
  if (!platforms.every((p) => RIDESHARE_PLATFORMS.includes(p as (typeof RIDESHARE_PLATFORMS)[number]))) {
    return { ok: false, error: "Plataforma inválida." };
  }

  return {
    ok: true,
    value: {
      logDate,
      kmDriven,
      earnings,
      fuelLiters,
      fuelCost,
      fuelPricePerLiter,
      fuelType,
      tripCount,
      tips,
      platforms,
      startTime,
      endTime,
    },
  };
}

// Siempre crea un registro nuevo (puede haber más de uno por día, ej.
// turno mañana y turno tarde).
export async function saveLog(_prev: UberFormState, formData: FormData): Promise<UberFormState> {
  const { userId } = await verifySession();
  const parsed = parseUberLogForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("uber_logs").insert({
    user_id: userId,
    log_date: parsed.value.logDate,
    km_driven: parsed.value.kmDriven,
    earnings: parsed.value.earnings,
    fuel_liters: parsed.value.fuelLiters,
    fuel_cost: parsed.value.fuelCost,
    fuel_price_per_liter: parsed.value.fuelPricePerLiter,
    fuel_type: parsed.value.fuelType,
    trip_count: parsed.value.tripCount,
    tips: parsed.value.tips,
    platforms: parsed.value.platforms,
    start_time: parsed.value.startTime,
    end_time: parsed.value.endTime,
  });

  if (error) return { error: "No se pudo guardar el registro." };

  revalidatePath("/uber");
  revalidatePath("/");
  return undefined;
}

// Actualiza un registro puntual por id (la fecha ya no es la clave, así
// que se puede editar libremente sin riesgo de chocar con otro turno).
export async function updateLog(_prev: UberFormState, formData: FormData): Promise<UberFormState> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Registro no encontrado." };

  const parsed = parseUberLogForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("uber_logs")
    .update({
      log_date: parsed.value.logDate,
      km_driven: parsed.value.kmDriven,
      earnings: parsed.value.earnings,
      fuel_liters: parsed.value.fuelLiters,
      fuel_cost: parsed.value.fuelCost,
      fuel_price_per_liter: parsed.value.fuelPricePerLiter,
      fuel_type: parsed.value.fuelType,
      trip_count: parsed.value.tripCount,
      tips: parsed.value.tips,
      platforms: parsed.value.platforms,
      start_time: parsed.value.startTime,
      end_time: parsed.value.endTime,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: "No se pudo actualizar el registro." };

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
  const maintenanceIntervalKmRaw = String(formData.get("maintenanceIntervalKm") ?? "").trim();
  const maintenanceIntervalKm = maintenanceIntervalKmRaw ? Number(maintenanceIntervalKmRaw) : null;

  if (!Number.isFinite(fuelPricePerLiter) || fuelPricePerLiter < 0) {
    return { error: "Ingresa un precio de bencina válido." };
  }
  if (!Number.isFinite(kmPerLiter) || kmPerLiter < 0) {
    return { error: "Ingresa un rendimiento km/litro válido." };
  }
  if (!WORK_DAYS_MODES.includes(workDaysMode as WorkDaysMode)) {
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
  if (
    maintenanceIntervalKm !== null &&
    (!Number.isFinite(maintenanceIntervalKm) || maintenanceIntervalKm <= 0)
  ) {
    return { error: "El intervalo de mantención debe ser un número mayor a 0, o déjalo vacío." };
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
      maintenance_interval_km: maintenanceIntervalKm,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/uber");
  revalidatePath("/");
  return undefined;
}

// Se calcula sumando los km de uber_logs desde la última mantención vía una
// función de Postgres (km_since_maintenance), en vez de traer todas las
// filas y sumarlas en JavaScript.
export async function getKmSinceMaintenance(lastMaintenanceDate: string | null): Promise<number> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("km_since_maintenance", {
    p_user_id: userId,
    p_since: lastMaintenanceDate,
  });
  if (error) throw new Error("No se pudo calcular el kilometraje desde la última mantención.");
  return Number(data ?? 0);
}

export async function markMaintenanceDone(): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, last_maintenance_date: todayISO() },
      { onConflict: "user_id" }
    );
  revalidatePath("/uber");
}

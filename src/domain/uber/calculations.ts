import type { UberLog } from "@/domain/entities/uber-log";

// null si falta hora de inicio o término. Si el turno cruza medianoche
// (término menor que inicio) se asume que terminó al día siguiente.
export function calculateHoursWorked(log: Pick<UberLog, "startTime" | "endTime">): number | null {
  if (!log.startTime || !log.endTime) return null;
  const [startH, startM] = log.startTime.slice(0, 5).split(":").map(Number);
  const [endH, endM] = log.endTime.slice(0, 5).split(":").map(Number);
  if ([startH, startM, endH, endM].some((n) => !Number.isFinite(n))) return null;

  let minutes = endH * 60 + endM - (startH * 60 + startM);
  if (minutes < 0) minutes += 24 * 60;
  return minutes / 60;
}

export function calculateTotalEarnings(log: Pick<UberLog, "earnings" | "tips">): number {
  return log.earnings + (log.tips ?? 0);
}

export function calculateNetProfit(log: Pick<UberLog, "earnings" | "tips" | "fuelCost">): number {
  return calculateTotalEarnings(log) - (log.fuelCost ?? 0);
}

export function calculateEarningsPerHour(
  log: Pick<UberLog, "earnings" | "tips" | "startTime" | "endTime">
): number | null {
  const hours = calculateHoursWorked(log);
  if (hours === null || hours <= 0) return null;
  return calculateTotalEarnings(log) / hours;
}

export function calculateEarningsPerTrip(
  log: Pick<UberLog, "earnings" | "tips" | "tripCount">
): number | null {
  if (!log.tripCount || log.tripCount <= 0) return null;
  return calculateTotalEarnings(log) / log.tripCount;
}

export function calculateRealKmPerLiter(
  log: Pick<UberLog, "kmDriven" | "fuelLiters">
): number | null {
  if (!log.fuelLiters || log.fuelLiters <= 0) return null;
  return log.kmDriven / log.fuelLiters;
}

export type UberPeriodStats = {
  totalEarnings: number;
  totalNet: number;
  totalKm: number;
  totalHours: number;
  daysWorked: number;
  avgEarningsPerDay: number;
  avgEarningsPerHour: number | null;
};

export function summarizeUberLogs(logs: UberLog[]): UberPeriodStats {
  const totalEarnings = logs.reduce((sum, log) => sum + calculateTotalEarnings(log), 0);
  const totalNet = logs.reduce((sum, log) => sum + calculateNetProfit(log), 0);
  const totalKm = logs.reduce((sum, log) => sum + log.kmDriven, 0);
  const totalHours = logs.reduce((sum, log) => sum + (calculateHoursWorked(log) ?? 0), 0);
  const daysWorked = logs.length;

  return {
    totalEarnings,
    totalNet,
    totalKm,
    totalHours,
    daysWorked,
    avgEarningsPerDay: daysWorked > 0 ? totalEarnings / daysWorked : 0,
    avgEarningsPerHour: totalHours > 0 ? totalEarnings / totalHours : null,
  };
}

function mondayOf(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

export type UberWeekGroup = {
  weekStart: string;
  logs: UberLog[];
  stats: UberPeriodStats;
};

// Agrupa por semana (lunes a domingo), más reciente primero.
export function groupLogsByWeek(logs: UberLog[]): UberWeekGroup[] {
  const groups = new Map<string, UberLog[]>();
  for (const log of logs) {
    const key = mondayOf(log.logDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([weekStart, weekLogs]) => ({
      weekStart,
      logs: weekLogs,
      stats: summarizeUberLogs(weekLogs),
    }));
}

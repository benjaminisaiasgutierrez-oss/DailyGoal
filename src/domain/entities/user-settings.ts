export const WORK_DAYS_MODES = ["fixed_count", "automatic"] as const;

export type WorkDaysMode = (typeof WORK_DAYS_MODES)[number];

export type UserSettings = {
  userId: string;
  fuelPricePerLiter: number;
  kmPerLiter: number;
  workDaysMode: WorkDaysMode;
  workDaysPerMonth: number | null;
  uberModeEnabled: boolean;
  maintenanceIntervalKm: number | null;
  lastMaintenanceDate: string | null;
  biometricLockEnabled: boolean;
  updatedAt: string;
};

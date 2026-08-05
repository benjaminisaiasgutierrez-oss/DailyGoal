export const WORK_DAYS_MODES = ["weekdays", "fixed_count"] as const;

export type WorkDaysMode = (typeof WORK_DAYS_MODES)[number];

export type UserSettings = {
  userId: string;
  fuelPricePerLiter: number;
  kmPerLiter: number;
  workDays: number[];
  workDaysMode: WorkDaysMode;
  workDaysPerMonth: number | null;
  uberModeEnabled: boolean;
  savingsGoalAmount: number | null;
  savingsGoalTargetDate: string | null;
  updatedAt: string;
};

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5, 6];

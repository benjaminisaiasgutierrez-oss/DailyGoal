export type UserSettings = {
  userId: string;
  fuelPricePerLiter: number;
  kmPerLiter: number;
  workDays: number[];
  uberModeEnabled: boolean;
  savingsGoalAmount: number | null;
  savingsGoalTargetDate: string | null;
  updatedAt: string;
};

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5, 6];

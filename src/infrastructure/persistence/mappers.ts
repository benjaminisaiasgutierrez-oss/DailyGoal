import type { Debt, DebtPayment, DebtType } from "@/domain/entities/debt";
import type { UberLog } from "@/domain/entities/uber-log";
import type { UserSettings, WorkDaysMode } from "@/domain/entities/user-settings";
import type { Income, IncomeType } from "@/domain/entities/income";

type DebtRow = {
  id: string;
  user_id: string;
  name: string;
  type: DebtType;
  amount: number;
  due_day: number;
  total_installments: number | null;
  installments_paid: number;
  active: boolean;
  created_at: string;
};

type DebtPaymentRow = {
  id: string;
  debt_id: string;
  installment_number: number;
  amount: number;
  paid_at: string;
};

type UberLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  km_driven: number;
  earnings: number;
  fuel_liters: number | null;
  fuel_cost: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
};

type UserSettingsRow = {
  user_id: string;
  fuel_price_per_liter: number;
  km_per_liter: number;
  work_days: number[];
  work_days_mode: WorkDaysMode;
  work_days_per_month: number | null;
  uber_mode_enabled: boolean;
  savings_goal_amount: number | null;
  savings_goal_target_date: string | null;
  updated_at: string;
};

export function mapDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    amount: Number(row.amount),
    dueDay: row.due_day,
    totalInstallments: row.total_installments,
    installmentsPaid: row.installments_paid,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapDebtPayment(row: DebtPaymentRow): DebtPayment {
  return {
    id: row.id,
    debtId: row.debt_id,
    installmentNumber: row.installment_number,
    amount: Number(row.amount),
    paidAt: row.paid_at,
  };
}

export function mapUberLog(row: UberLogRow): UberLog {
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    kmDriven: Number(row.km_driven),
    earnings: Number(row.earnings),
    fuelLiters: row.fuel_liters !== null ? Number(row.fuel_liters) : null,
    fuelCost: row.fuel_cost !== null ? Number(row.fuel_cost) : null,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
  };
}

export function mapUserSettings(row: UserSettingsRow): UserSettings {
  return {
    userId: row.user_id,
    fuelPricePerLiter: Number(row.fuel_price_per_liter),
    kmPerLiter: Number(row.km_per_liter),
    workDays: row.work_days,
    workDaysMode: row.work_days_mode,
    workDaysPerMonth: row.work_days_per_month,
    uberModeEnabled: row.uber_mode_enabled,
    savingsGoalAmount: row.savings_goal_amount !== null ? Number(row.savings_goal_amount) : null,
    savingsGoalTargetDate: row.savings_goal_target_date,
    updatedAt: row.updated_at,
  };
}

type IncomeRow = {
  id: string;
  user_id: string;
  name: string;
  type: IncomeType;
  amount: number;
  is_recurring: boolean;
  income_date: string | null;
  payment_day: number | null;
  created_at: string;
};

export function mapIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    amount: Number(row.amount),
    isRecurring: row.is_recurring,
    incomeDate: row.income_date,
    paymentDay: row.payment_day,
    createdAt: row.created_at,
  };
}

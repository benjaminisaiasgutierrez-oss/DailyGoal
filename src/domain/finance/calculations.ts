import type { Debt } from "@/domain/entities/debt";
import type { UserSettings } from "@/domain/entities/user-settings";

// No cuenta como "terminado" si todavía quedan cuotas atrasadas declaradas,
// aunque el conteo normal de cuotas ya haya llegado al total.
export function isDebtFinished(
  debt: Pick<Debt, "totalInstallments" | "installmentsPaid" | "installmentsOverdue">
): boolean {
  return (
    debt.totalInstallments !== null &&
    debt.installmentsPaid >= debt.totalInstallments &&
    debt.installmentsOverdue === 0
  );
}

export function isDebtOwingThisMonth(
  debt: Pick<Debt, "active" | "totalInstallments" | "installmentsPaid" | "installmentsOverdue">
): boolean {
  return debt.active && !isDebtFinished(debt);
}

export function calculateMonthlyTotal(debts: Debt[]): number {
  return debts
    .filter(isDebtOwingThisMonth)
    .reduce((sum, debt) => sum + debt.amount * (1 + debt.installmentsOverdue), 0);
}

export function calculateRemainingBalance(
  debt: Pick<Debt, "totalInstallments" | "installmentsPaid" | "amount" | "installmentsOverdue">
): number | null {
  const overdueAmount = debt.installmentsOverdue * debt.amount;
  if (debt.totalInstallments === null) {
    return overdueAmount > 0 ? overdueAmount : null;
  }
  return Math.max(debt.totalInstallments - debt.installmentsPaid, 0) * debt.amount + overdueAmount;
}

export function getWorkingDaysInMonth(year: number, month: number, workDays: number[]): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    if (workDays.includes(weekday)) count++;
  }
  return count;
}

export function resolveWorkingDaysInMonth(
  settings: Pick<UserSettings, "workDaysMode" | "workDays" | "workDaysPerMonth">,
  year: number,
  month: number
): number {
  if (settings.workDaysMode === "fixed_count") {
    return settings.workDaysPerMonth ?? 0;
  }
  return getWorkingDaysInMonth(year, month, settings.workDays);
}

export function calculateDailyGoal(monthlyTotal: number, workingDaysInMonth: number): number {
  if (workingDaysInMonth <= 0) return 0;
  return monthlyTotal / workingDaysInMonth;
}

// Atrasado: o bien el usuario declaró cuotas atrasadas a mano, o ya pasó el
// día de pago de este mes y no hay ningún pago registrado en lo que va del mes.
export function isDebtOverdue(
  debt: Pick<
    Debt,
    "active" | "totalInstallments" | "installmentsPaid" | "dueDay" | "installmentsOverdue"
  >,
  paidThisMonth: boolean,
  todayDayOfMonth: number
): boolean {
  if (debt.installmentsOverdue > 0) return true;
  return isDebtOwingThisMonth(debt) && todayDayOfMonth > debt.dueDay && !paidThisMonth;
}

import type { Debt } from "@/domain/entities/debt";

export function isDebtFinished(
  debt: Pick<Debt, "totalInstallments" | "installmentsPaid">
): boolean {
  return debt.totalInstallments !== null && debt.installmentsPaid >= debt.totalInstallments;
}

export function isDebtOwingThisMonth(
  debt: Pick<Debt, "active" | "totalInstallments" | "installmentsPaid">
): boolean {
  return debt.active && !isDebtFinished(debt);
}

export function calculateMonthlyTotal(debts: Debt[]): number {
  return debts.filter(isDebtOwingThisMonth).reduce((sum, debt) => sum + debt.amount, 0);
}

export function calculateRemainingBalance(
  debt: Pick<Debt, "totalInstallments" | "installmentsPaid" | "amount">
): number | null {
  if (debt.totalInstallments === null) return null;
  return Math.max(debt.totalInstallments - debt.installmentsPaid, 0) * debt.amount;
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

export function calculateDailyGoal(monthlyTotal: number, workingDaysInMonth: number): number {
  if (workingDaysInMonth <= 0) return 0;
  return monthlyTotal / workingDaysInMonth;
}

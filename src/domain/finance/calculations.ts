import type { Debt } from "@/domain/entities/debt";
import type { SavingsGoal } from "@/domain/entities/savings-goal";

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

export function calculateDailyGoal(monthlyTotal: number, workingDaysInMonth: number): number {
  if (workingDaysInMonth <= 0) return 0;
  return monthlyTotal / workingDaysInMonth;
}

// Meses restantes hasta la fecha límite de una meta de ahorro, contando el
// mes actual. Si la fecha ya pasó o cae este mismo mes, se cobra todo ahora.
function monthsRemainingUntil(todayISODate: string, targetDate: string): number {
  const [todayYear, todayMonth] = todayISODate.split("-").map(Number);
  const [targetYear, targetMonth] = targetDate.split("-").map(Number);
  const diff = (targetYear - todayYear) * 12 + (targetMonth - todayMonth);
  return Math.max(diff + 1, 1);
}

// Solo las metas con monto y fecha límite pueden repartirse por mes; una
// meta sin fecha no tiene un mes al que "deba" dinero todavía.
export function calculateSavingsMonthlyPace(
  goals: Pick<SavingsGoal, "targetAmount" | "targetDate" | "savedAmount">[],
  todayISODate: string
): number {
  return goals.reduce((sum, goal) => {
    if (goal.targetAmount === null || goal.targetDate === null) return sum;
    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
    if (remaining === 0) return sum;
    return sum + remaining / monthsRemainingUntil(todayISODate, goal.targetDate);
  }, 0);
}

// Modo automático: reparte lo que falta del mes entre los días que quedan,
// en vez de un promedio fijo. Si ya está cubierto, no hay meta -sobra plata-.
export function calculateAutomaticDailyGoal(params: {
  totalNeeded: number;
  earnedBeforeToday: number;
  daysRemaining: number;
}): { amount: number; surplus: number } {
  const remaining = params.totalNeeded - params.earnedBeforeToday;
  if (remaining <= 0) return { amount: 0, surplus: -remaining };
  return { amount: remaining / params.daysRemaining, surplus: 0 };
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

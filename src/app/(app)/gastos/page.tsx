import type { Metadata } from "next";
import { getDebtIdsPaidThisMonth, getDebts } from "@/application/debts/manage-debts";
import {
  calculateMonthlyTotal,
  isDebtOverdue,
  isDebtOwingThisMonth,
} from "@/domain/finance/calculations";
import { formatCLP } from "@/lib/format";
import { DebtCard } from "@/components/debt-card";
import { DebtFormDialog } from "@/components/debt-form-dialog";

export const metadata: Metadata = {
  title: "Gastos",
};

export default async function GastosPage() {
  const [debts, paidThisMonthIds] = await Promise.all([getDebts(), getDebtIdsPaidThisMonth()]);
  const todayDayOfMonth = new Date().getDate();

  const owing = debts.filter(isDebtOwingThisMonth);
  const finished = debts.filter((debt) => !isDebtOwingThisMonth(debt));
  const monthlyTotal = calculateMonthlyTotal(debts);

  const overdue: typeof owing = [];
  const pending: typeof owing = [];
  const paidThisMonth: typeof owing = [];

  for (const debt of owing) {
    const isPaid = paidThisMonthIds.has(debt.id);
    if (isPaid) {
      paidThisMonth.push(debt);
    } else if (isDebtOverdue(debt, isPaid, todayDayOfMonth)) {
      overdue.push(debt);
    } else {
      pending.push(debt);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">Total este mes: {formatCLP(monthlyTotal)}</p>
        </div>
        <DebtFormDialog />
      </div>

      {owing.length === 0 && finished.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavía no agregas ningún gasto.
        </p>
      )}

      {overdue.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-destructive">Vencidas ({overdue.length})</h2>
          {overdue.map((debt) => (
            <DebtCard key={debt.id} debt={debt} isOverdue />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Pendientes este mes ({pending.length})
          </h2>
          {pending.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      {paidThisMonth.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Al día ({paidThisMonth.length})
          </h2>
          {paidThisMonth.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      {finished.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Pagados / archivados</h2>
          {finished.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}
    </div>
  );
}

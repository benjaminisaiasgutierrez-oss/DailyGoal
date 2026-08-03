import type { Metadata } from "next";
import { getDebts } from "@/application/debts/manage-debts";
import { calculateMonthlyTotal, isDebtOwingThisMonth } from "@/domain/finance/calculations";
import { formatCLP } from "@/lib/format";
import { DebtCard } from "@/components/debt-card";
import { DebtFormDialog } from "@/components/debt-form-dialog";

export const metadata: Metadata = {
  title: "Gastos",
};

export default async function GastosPage() {
  const debts = await getDebts();
  const active = debts.filter(isDebtOwingThisMonth);
  const finished = debts.filter((debt) => !isDebtOwingThisMonth(debt));
  const monthlyTotal = calculateMonthlyTotal(debts);

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">Total este mes: {formatCLP(monthlyTotal)}</p>
        </div>
        <DebtFormDialog />
      </div>

      {active.length === 0 && finished.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavía no agregas ningún gasto.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {active.map((debt) => (
          <DebtCard key={debt.id} debt={debt} />
        ))}
      </div>

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

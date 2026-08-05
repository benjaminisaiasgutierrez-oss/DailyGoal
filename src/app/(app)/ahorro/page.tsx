import type { Metadata } from "next";
import Link from "next/link";
import { getDebts } from "@/application/debts/manage-debts";
import { getIncomes } from "@/application/incomes/manage-incomes";
import { getUserSettings } from "@/application/uber/manage-uber";
import { calculateSavedAmount } from "@/domain/finance/calculations";
import { formatCLP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SavingsGoalForm } from "@/components/savings-goal-form";

export const metadata: Metadata = {
  title: "Ahorro",
};

export default async function AhorroPage() {
  const [debts, incomes, settings] = await Promise.all([
    getDebts(),
    getIncomes(500),
    getUserSettings(),
  ]);

  const savedAmount = calculateSavedAmount(debts, incomes);
  const savingsGoal = settings.savingsGoalAmount;
  const savingsProgress = savingsGoal ? Math.min((savedAmount / savingsGoal) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold tracking-tight">Ahorro</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progreso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {savingsGoal ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ahorrado</span>
                <span className="font-medium">{formatCLP(savedAmount)}</span>
              </div>
              <Progress value={savingsProgress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Meta {formatCLP(savingsGoal)}</span>
                <span>Faltan {formatCLP(Math.max(savingsGoal - savedAmount, 0))}</span>
              </div>
              {settings.savingsGoalTargetDate && (
                <span className="text-xs text-muted-foreground">
                  Objetivo: {settings.savingsGoalTargetDate}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ahorrado</span>
                <span className="font-medium">{formatCLP(savedAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Define una meta abajo para ver tu avance.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta de ahorro</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsGoalForm settings={settings} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        El ahorrado se calcula desde las cuotas pagadas en{" "}
        <Link href="/gastos" className="underline">
          Gastos
        </Link>{" "}
        y los{" "}
        <Link href="/ingresos" className="underline">
          Ingresos
        </Link>{" "}
        con categoría Ahorro.
      </p>
    </div>
  );
}

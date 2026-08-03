import type { Metadata } from "next";
import { Calendar, LogOut } from "lucide-react";
import { getCurrentUser } from "@/application/auth/get-session";
import { logout } from "@/application/auth/authenticate-user";
import { getDebts } from "@/application/debts/manage-debts";
import { getUberLogsInRange, getUserSettings } from "@/application/uber/manage-uber";
import { getIncomesInRange } from "@/application/incomes/manage-incomes";
import {
  calculateDailyGoal,
  calculateMonthlyTotal,
  calculateRemainingBalance,
  getWorkingDaysInMonth,
  isDebtOwingThisMonth,
} from "@/domain/finance/calculations";
import { DEBT_TYPE_LABELS } from "@/domain/entities/debt";
import { formatCLP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Resumen",
};

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const first = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const last = new Date(year, month, 0).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  return { year, month, first, last, today };
}

export default async function HomePage() {
  const { year, month, first, last, today } = currentMonthRange();

  const [user, debts, settings, logsThisMonth, incomesThisMonth] = await Promise.all([
    getCurrentUser(),
    getDebts(),
    getUserSettings(),
    getUberLogsInRange(first, last),
    getIncomesInRange(first, last),
  ]);

  const monthlyTotal = calculateMonthlyTotal(debts);
  const workingDays = getWorkingDaysInMonth(year, month, settings.workDays);
  const dailyGoal = calculateDailyGoal(monthlyTotal, workingDays);

  const uberEarnedThisMonth = logsThisMonth.reduce((sum, log) => sum + log.earnings, 0);
  const incomeThisMonth = incomesThisMonth.reduce((sum, income) => sum + income.amount, 0);
  const earnedThisMonth = uberEarnedThisMonth + incomeThisMonth;

  const todayLog = logsThisMonth.find((log) => log.logDate === today);
  const incomeToday = incomesThisMonth
    .filter((income) => income.incomeDate === today)
    .reduce((sum, income) => sum + income.amount, 0);
  const earnedToday = (todayLog?.earnings ?? 0) + incomeToday;
  const fuelCostToday = todayLog?.fuelCost ?? 0;
  const totalToEarnToday = dailyGoal + fuelCostToday;
  const net = earnedThisMonth - monthlyTotal;

  const activeDebts = debts.filter(isDebtOwingThisMonth);
  const remainingDebt = activeDebts.reduce(
    (sum, debt) => sum + (calculateRemainingBalance(debt) ?? 0),
    0
  );
  const upcoming = [...activeDebts].sort((a, b) => a.dueDay - b.dueDay).slice(0, 5);
  const monthProgress = monthlyTotal > 0 ? Math.min((earnedThisMonth / monthlyTotal) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Hola{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Cerrar sesión">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-sm text-muted-foreground">Meta diaria</span>
          <span className="text-3xl font-semibold tracking-tight">{formatCLP(dailyGoal)}</span>

          {fuelCostToday > 0 && (
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Meta {formatCLP(dailyGoal)} + Bencina de hoy {formatCLP(fuelCostToday)}
              </span>
              <span className="font-medium">Total a ganar hoy: {formatCLP(totalToEarnToday)}</span>
            </div>
          )}

          <span className="text-xs text-muted-foreground">Hoy ganaste {formatCLP(earnedToday)}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Este mes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ganado</span>
            <span className="font-medium">{formatCLP(earnedThisMonth)}</span>
          </div>
          {incomeThisMonth > 0 && (
            <div className="flex items-center justify-between pl-3 text-xs text-muted-foreground">
              <span>Uber {formatCLP(uberEarnedThisMonth)} + Ingresos {formatCLP(incomeThisMonth)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cuentas del mes</span>
            <span className="font-medium">{formatCLP(monthlyTotal)}</span>
          </div>
          <Progress value={monthProgress} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Neto</span>
            <span className={net >= 0 ? "font-medium" : "font-medium text-destructive"}>
              {formatCLP(net)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deuda pendiente</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">{formatCLP(remainingDebt)}</span>
        </CardContent>
      </Card>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {upcoming.map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{debt.name}</span>
                  <Badge variant="secondary" className="w-fit text-[10px]">
                    {DEBT_TYPE_LABELS[debt.type]}
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium">{formatCLP(debt.amount)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    día {debt.dueDay}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

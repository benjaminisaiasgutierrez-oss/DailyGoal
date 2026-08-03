import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/application/auth/get-session";
import { logout } from "@/application/auth/authenticate-user";
import { getDebts } from "@/application/debts/manage-debts";
import { getUberLogsInRange, getUserSettings } from "@/application/uber/manage-uber";
import {
  calculateDailyGoal,
  calculateMonthlyTotal,
  calculateRemainingBalance,
  getWorkingDaysInMonth,
  isDebtOwingThisMonth,
} from "@/domain/finance/calculations";
import { formatCLP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [user, debts, settings, logsThisMonth] = await Promise.all([
    getCurrentUser(),
    getDebts(),
    getUserSettings(),
    getUberLogsInRange(first, last),
  ]);

  const monthlyTotal = calculateMonthlyTotal(debts);
  const workingDays = getWorkingDaysInMonth(year, month, settings.workDays);
  const dailyGoal = calculateDailyGoal(monthlyTotal, workingDays);

  const earnedThisMonth = logsThisMonth.reduce((sum, log) => sum + log.earnings, 0);
  const earnedToday = logsThisMonth.find((log) => log.logDate === today)?.earnings ?? 0;
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
        <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
          <span className="text-sm text-muted-foreground">Meta diaria</span>
          <span className="text-3xl font-semibold tracking-tight">{formatCLP(dailyGoal)}</span>
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
              <div key={debt.id} className="flex items-center justify-between text-sm">
                <span>{debt.name}</span>
                <span className="text-muted-foreground">
                  día {debt.dueDay} · {formatCLP(debt.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

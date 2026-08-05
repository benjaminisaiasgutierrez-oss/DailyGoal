import { groupLogsByWeek } from "@/domain/uber/calculations";
import type { UberLog } from "@/domain/entities/uber-log";
import { formatCLP, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatWeekLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

export function UberWeeklySummary({ logs }: { logs: UberLog[] }) {
  const weeks = groupLogsByWeek(logs).slice(0, 6);

  if (weeks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumen semanal</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {weeks.map((week) => (
          <div
            key={week.weekStart}
            className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{formatWeekLabel(week.weekStart)}</span>
              <span className="font-medium">{formatCLP(week.stats.totalEarnings)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {week.stats.daysWorked} día{week.stats.daysWorked === 1 ? "" : "s"} ·{" "}
                {formatNumber(week.stats.totalKm)} km
              </span>
              <span>Neto {formatCLP(week.stats.totalNet)}</span>
            </div>
            {week.stats.avgEarningsPerHour !== null && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Promedio por día {formatCLP(week.stats.avgEarningsPerDay)}</span>
                <span>{formatCLP(week.stats.avgEarningsPerHour)}/hora</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

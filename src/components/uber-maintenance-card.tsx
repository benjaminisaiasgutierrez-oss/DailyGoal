import { markMaintenanceDone } from "@/application/uber/manage-uber";
import { formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SubmitButton } from "@/components/submit-button";

export function UberMaintenanceCard({
  kmSinceMaintenance,
  maintenanceIntervalKm,
}: {
  kmSinceMaintenance: number;
  maintenanceIntervalKm: number;
}) {
  const progress = Math.min((kmSinceMaintenance / maintenanceIntervalKm) * 100, 100);
  const due = kmSinceMaintenance >= maintenanceIntervalKm;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mantención</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Desde la última</span>
          <span className={due ? "font-medium text-destructive" : "font-medium"}>
            {formatNumber(kmSinceMaintenance)} / {formatNumber(maintenanceIntervalKm)} km
          </span>
        </div>
        <Progress value={progress} aria-label="Progreso hacia la próxima mantención" />
        {due && <p className="text-xs text-destructive">Ya pasaste el intervalo que configuraste.</p>}
        <form action={markMaintenanceDone}>
          <SubmitButton variant="outline" className="w-full" size="sm" pendingLabel="Guardando...">
            Marcar mantención hecha
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

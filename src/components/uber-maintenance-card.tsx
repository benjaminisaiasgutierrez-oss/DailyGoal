import { markMaintenanceDone } from "@/application/uber/manage-uber";
import { formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
        <Progress value={progress} />
        {due && <p className="text-xs text-destructive">Ya pasaste el intervalo que configuraste.</p>}
        <form action={markMaintenanceDone}>
          <Button type="submit" variant="outline" className="w-full" size="sm">
            Marcar mantención hecha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

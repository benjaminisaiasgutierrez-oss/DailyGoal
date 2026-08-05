import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deleteLog, getKmSinceMaintenance, getUberLogs, getUserSettings } from "@/application/uber/manage-uber";
import { calculateEarningsPerHour, calculateNetProfit, calculateTotalEarnings } from "@/domain/uber/calculations";
import { FUEL_TYPE_LABELS, RIDESHARE_PLATFORM_LABELS } from "@/domain/entities/uber-log";
import { formatCLP, formatNumber } from "@/lib/format";
import { UberLogForm } from "@/components/uber-log-form";
import { UberLogFormDialog } from "@/components/uber-log-form-dialog";
import { UberSettingsForm } from "@/components/uber-settings-form";
import { UberWeeklySummary } from "@/components/uber-weekly-summary";
import { UberMaintenanceCard } from "@/components/uber-maintenance-card";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Uber",
};

export default async function UberPage() {
  const [logs, settings] = await Promise.all([getUberLogs(), getUserSettings()]);

  if (!settings.uberModeEnabled) {
    redirect("/");
  }

  const kmSinceMaintenance =
    settings.maintenanceIntervalKm !== null
      ? await getKmSinceMaintenance(settings.lastMaintenanceDate)
      : null;

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold tracking-tight">Control Uber</h1>

      <UberLogForm />
      <UberWeeklySummary logs={logs} />
      {settings.maintenanceIntervalKm !== null && kmSinceMaintenance !== null && (
        <UberMaintenanceCard
          kmSinceMaintenance={kmSinceMaintenance}
          maintenanceIntervalKm={settings.maintenanceIntervalKm}
        />
      )}
      <UberSettingsForm settings={settings} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Historial</h2>
        {logs.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin registros todavía.</p>
        )}
        {logs.map((log) => {
          const totalEarnings = calculateTotalEarnings(log);
          const netProfit = calculateNetProfit(log);
          const perHour = calculateEarningsPerHour(log);

          return (
            <div
              key={log.id}
              className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10"
            >
              <div className="flex flex-1 items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{log.logDate}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(log.kmDriven)} km
                    {log.startTime && log.endTime
                      ? ` · ${log.startTime.slice(0, 5)} - ${log.endTime.slice(0, 5)}`
                      : ""}
                  </span>
                  {(log.platforms.length > 0 || log.fuelType) && (
                    <div className="flex flex-wrap gap-1">
                      {log.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-[10px]">
                          {RIDESHARE_PLATFORM_LABELS[platform]}
                        </Badge>
                      ))}
                      {log.fuelType && (
                        <Badge variant="secondary" className="text-[10px]">
                          {FUEL_TYPE_LABELS[log.fuelType]}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-medium">{formatCLP(totalEarnings)}</span>
                  {log.fuelCost !== null && (
                    <span className="text-xs text-muted-foreground">
                      Bencina {formatCLP(log.fuelCost)}
                      {log.fuelPricePerLiter !== null &&
                        ` · ${formatCLP(log.fuelPricePerLiter)}/L`}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">Neto {formatCLP(netProfit)}</span>
                  {perHour !== null && (
                    <span className="text-xs text-muted-foreground">
                      {formatCLP(perHour)}/hora
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <UberLogFormDialog log={log} />
                <ConfirmDeleteButton
                  action={deleteLog.bind(null, log.id)}
                  confirmMessage={`¿Eliminar el registro del ${log.logDate}?`}
                  label="Eliminar registro"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

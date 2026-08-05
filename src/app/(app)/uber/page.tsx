import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUberLogs, getUserSettings } from "@/application/uber/manage-uber";
import { formatCLP, formatNumber } from "@/lib/format";
import { UberLogForm } from "@/components/uber-log-form";
import { UberSettingsForm } from "@/components/uber-settings-form";

export const metadata: Metadata = {
  title: "Uber",
};

export default async function UberPage() {
  const [logs, settings] = await Promise.all([getUberLogs(), getUserSettings()]);

  if (!settings.uberModeEnabled) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold tracking-tight">Control Uber</h1>

      <UberLogForm />
      <UberSettingsForm settings={settings} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Historial</h2>
        {logs.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin registros todavía.</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10"
          >
            <div className="flex flex-col">
              <span className="font-medium">{log.logDate}</span>
              <span className="text-xs text-muted-foreground">
                {formatNumber(log.kmDriven)} km
                {log.startTime && log.endTime
                  ? ` · ${log.startTime.slice(0, 5)} - ${log.endTime.slice(0, 5)}`
                  : ""}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-medium">{formatCLP(log.earnings)}</span>
              {log.fuelCost !== null && (
                <span className="text-xs text-muted-foreground">
                  Bencina {formatCLP(log.fuelCost)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

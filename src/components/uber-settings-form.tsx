"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateSettings, type UberFormState } from "@/application/uber/manage-uber";
import { WEEKDAY_LABELS } from "@/domain/entities/user-settings";
import type { UserSettings } from "@/domain/entities/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UberSettingsForm({ settings }: { settings: UserSettings }) {
  const [state, formAction, pending] = useActionState<UberFormState, FormData>(
    updateSettings,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      toast.success("Configuración guardada");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuración</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fuelPricePerLiter">Precio bencina (litro)</Label>
              <Input
                id="fuelPricePerLiter"
                name="fuelPricePerLiter"
                type="number"
                min="0"
                step="1"
                defaultValue={settings.fuelPricePerLiter || undefined}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kmPerLiter">Rendimiento km/litro</Label>
              <Input
                id="kmPerLiter"
                name="kmPerLiter"
                type="number"
                min="0"
                step="0.1"
                defaultValue={settings.kmPerLiter || undefined}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Días que trabajas</Label>
            <div className="flex flex-wrap gap-3">
              {WEEKDAY_LABELS.map((label, day) => (
                <label key={day} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    name="workDays"
                    value={String(day)}
                    defaultChecked={settings.workDays.includes(day)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar configuración"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

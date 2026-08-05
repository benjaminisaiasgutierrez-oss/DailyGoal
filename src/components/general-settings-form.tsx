"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  updateGeneralSettings,
  type SettingsFormState,
} from "@/application/settings/manage-settings";
import type { UserSettings } from "@/domain/entities/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function GeneralSettingsForm({ settings }: { settings: UserSettings }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    updateGeneralSettings,
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
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="uberModeEnabled" defaultChecked={settings.uberModeEnabled} />
        Modo Uber activado
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="savingsGoalAmount">Meta de ahorro</Label>
          <Input
            id="savingsGoalAmount"
            name="savingsGoalAmount"
            type="number"
            min="0"
            step="1"
            defaultValue={settings.savingsGoalAmount ?? ""}
            placeholder="Ej: 500000"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="savingsGoalTargetDate">Fecha objetivo</Label>
          <Input
            id="savingsGoalTargetDate"
            name="savingsGoalTargetDate"
            type="date"
            defaultValue={settings.savingsGoalTargetDate ?? ""}
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}

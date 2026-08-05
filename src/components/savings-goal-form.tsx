"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateSavingsGoal, type SavingsFormState } from "@/application/savings/manage-savings";
import type { UserSettings } from "@/domain/entities/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SavingsGoalForm({ settings }: { settings: UserSettings }) {
  const [state, formAction, pending] = useActionState<SavingsFormState, FormData>(
    updateSavingsGoal,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      toast.success("Meta guardada");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        {pending ? "Guardando..." : "Guardar meta"}
      </Button>
    </form>
  );
}

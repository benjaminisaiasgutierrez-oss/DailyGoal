"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveLog, type UberFormState } from "@/application/uber/manage-uber";
import type { UberLog } from "@/domain/entities/uber-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function UberLogForm({ log, onSaved }: { log?: UberLog; onSaved?: () => void }) {
  const [state, formAction, pending] = useActionState<UberFormState, FormData>(saveLog, undefined);
  const wasPending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      toast.success(log ? "Registro actualizado" : "Registro guardado");
      if (log) {
        onSaved?.();
      } else {
        formRef.current?.reset();
      }
    }
    wasPending.current = pending;
  }, [pending, state, log, onSaved]);

  const form = (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logDate">Fecha</Label>
        <Input
          id="logDate"
          name="logDate"
          type="date"
          defaultValue={log?.logDate ?? todayISO()}
          readOnly={!!log}
          className={log ? "bg-muted/40" : undefined}
          required
        />
        {log && <p className="text-xs text-muted-foreground">La fecha no se puede cambiar.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kmDriven">Km recorridos</Label>
          <Input
            id="kmDriven"
            name="kmDriven"
            type="number"
            min="0"
            step="0.1"
            defaultValue={log?.kmDriven}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="earnings">Ganado</Label>
          <Input
            id="earnings"
            name="earnings"
            type="number"
            min="0"
            step="1"
            defaultValue={log?.earnings}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startTime">Hora inicio</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={log?.startTime?.slice(0, 5) ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endTime">Hora término</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={log?.endTime?.slice(0, 5) ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fuelLiters">Litros cargados</Label>
          <Input
            id="fuelLiters"
            name="fuelLiters"
            type="number"
            min="0"
            step="0.1"
            defaultValue={log?.fuelLiters ?? ""}
            placeholder="Opcional"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fuelCost">Costo bencina</Label>
          <Input
            id="fuelCost"
            name="fuelCost"
            type="number"
            min="0"
            step="1"
            defaultValue={log?.fuelCost ?? ""}
            required
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : log ? "Guardar cambios" : "Guardar registro"}
      </Button>
    </form>
  );

  if (log) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar día</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}

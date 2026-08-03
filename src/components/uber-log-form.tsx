"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveLog, type UberFormState } from "@/application/uber/manage-uber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function UberLogForm() {
  const [state, formAction, pending] = useActionState<UberFormState, FormData>(saveLog, undefined);
  const wasPending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      toast.success("Registro guardado");
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar día</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logDate">Fecha</Label>
            <Input id="logDate" name="logDate" type="date" defaultValue={todayISO()} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kmDriven">Km recorridos</Label>
              <Input id="kmDriven" name="kmDriven" type="number" min="0" step="0.1" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="earnings">Ganado</Label>
              <Input id="earnings" name="earnings" type="number" min="0" step="1" required />
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
                placeholder="Opcional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fuelCost">Costo bencina</Label>
              <Input id="fuelCost" name="fuelCost" type="number" min="0" step="1" placeholder="Opcional" />
            </div>
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar registro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

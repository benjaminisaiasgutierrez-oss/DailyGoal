"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { createIncome, updateIncome, type IncomeFormState } from "@/application/incomes/manage-incomes";
import { INCOME_TYPES, INCOME_TYPE_LABELS, type Income, type IncomeType } from "@/domain/entities/income";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function IncomeFormDialog({ income }: { income?: Income }) {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(income?.isRecurring ?? false);
  const action = income ? updateIncome : createIncome;
  const [state, formAction, pending] = useActionState<IncomeFormState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      toast.success(income ? "Ingreso actualizado" : "Ingreso agregado");
    }
    wasPending.current = pending;
  }, [pending, state, income]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {income ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Editar ingreso"
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Agregar ingreso
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{income ? "Editar ingreso" : "Nuevo ingreso"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {income && <input type="hidden" name="id" value={income.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={income?.name}
              placeholder="Ej: Sueldo, venta de..."
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={income?.type ?? "otro"}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue>
                  {(value: IncomeType) => INCOME_TYPE_LABELS[value] ?? "Selecciona un tipo"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INCOME_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {INCOME_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1"
              defaultValue={income?.amount}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="isRecurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
            />
            Ingreso Fijo
          </label>

          {isRecurring ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentDay">Día de pago (cada mes)</Label>
              <Input
                id="paymentDay"
                name="paymentDay"
                type="number"
                min="1"
                max="31"
                defaultValue={income?.paymentDay ?? ""}
                placeholder="Ej: 30"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="incomeDate">Fecha</Label>
              <Input
                id="incomeDate"
                name="incomeDate"
                type="date"
                defaultValue={income?.incomeDate ?? todayISO()}
                required
              />
            </div>
          )}

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

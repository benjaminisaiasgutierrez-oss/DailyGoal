"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { createDebt, updateDebt, type DebtFormState } from "@/application/debts/manage-debts";
import { DEBT_TYPES, DEBT_TYPE_LABELS, type Debt, type DebtType } from "@/domain/entities/debt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

export function DebtFormDialog({ debt }: { debt?: Debt }) {
  const [open, setOpen] = useState(false);
  const [installmentsMode, setInstallmentsMode] = useState<"count" | "fixed">(
    debt && debt.totalInstallments === null ? "fixed" : "count"
  );
  const action = debt ? updateDebt : createDebt;
  const [state, formAction, pending] = useActionState<DebtFormState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      toast.success(debt ? "Gasto actualizado" : "Gasto agregado");
    }
    wasPending.current = pending;
  }, [pending, state, debt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {debt ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Editar gasto"
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Agregar gasto
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{debt ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {debt && <input type="hidden" name="id" value={debt.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={debt?.name}
              placeholder="Ej: Netflix, Falabella..."
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={debt?.type ?? "otro"}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue>
                  {(value: DebtType) => DEBT_TYPE_LABELS[value] ?? "Selecciona un tipo"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DEBT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DEBT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Monto por cuota</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="1"
                defaultValue={debt?.amount}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDay">Día de pago</Label>
              <Input
                id="dueDay"
                name="dueDay"
                type="number"
                min="1"
                max="31"
                defaultValue={debt?.dueDay}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cuotas</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInstallmentsMode("count")}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  installmentsMode === "count"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-input text-muted-foreground"
                )}
              >
                Con cuotas
              </button>
              <button
                type="button"
                onClick={() => setInstallmentsMode("fixed")}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  installmentsMode === "fixed"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-input text-muted-foreground"
                )}
              >
                Gasto fijo
              </button>
            </div>
            {installmentsMode === "count" && (
              <Input
                id="totalInstallments"
                name="totalInstallments"
                type="number"
                min="1"
                defaultValue={debt?.totalInstallments ?? ""}
                placeholder="Ej: 12"
                className="mt-1"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installmentsPaid">Cuotas ya pagadas</Label>
              <Input
                id="installmentsPaid"
                name="installmentsPaid"
                type="number"
                min="0"
                defaultValue={debt?.installmentsPaid ?? 0}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installmentsOverdue">Cuotas atrasadas</Label>
              <Input
                id="installmentsOverdue"
                name="installmentsOverdue"
                type="number"
                min="0"
                defaultValue={debt?.installmentsOverdue ?? 0}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Las atrasadas se suman al monto pendiente y se pagan primero.
          </p>

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

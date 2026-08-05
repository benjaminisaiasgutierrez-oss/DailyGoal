"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  createSavingsGoal,
  updateSavingsGoal,
  type SavingsGoalFormState,
} from "@/application/savings/manage-savings";
import type { SavingsGoal } from "@/domain/entities/savings-goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SavingsGoalFormDialog({ goal }: { goal?: SavingsGoal }) {
  const [open, setOpen] = useState(false);
  const action = goal ? updateSavingsGoal : createSavingsGoal;
  const [state, formAction, pending] = useActionState<SavingsGoalFormState, FormData>(
    action,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      toast.success(goal ? "Meta actualizada" : "Meta creada");
    }
    wasPending.current = pending;
  }, [pending, state, goal]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {goal ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Editar meta"
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Nueva meta
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nueva meta de ahorro"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {goal && <input type="hidden" name="id" value={goal.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={goal?.name}
              placeholder="Ej: Vacaciones, Auto nuevo..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetAmount">Meta (opcional)</Label>
              <Input
                id="targetAmount"
                name="targetAmount"
                type="number"
                min="0"
                step="1"
                defaultValue={goal?.targetAmount ?? ""}
                placeholder="Ej: 500000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetDate">Fecha objetivo</Label>
              <Input
                id="targetDate"
                name="targetDate"
                type="date"
                defaultValue={goal?.targetDate ?? ""}
              />
            </div>
          </div>

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

"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { addContribution, type SavingsGoalFormState } from "@/application/savings/manage-savings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddContributionForm({ goalId }: { goalId: string }) {
  const [state, formAction, pending] = useActionState<SavingsGoalFormState, FormData>(
    addContribution,
    undefined
  );
  const wasPending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      toast.success("Aporte agregado");
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="goalId" value={goalId} />
      <div className="flex gap-2">
        <Input
          name="amount"
          type="number"
          min="0"
          step="1"
          placeholder="Monto del aporte"
          required
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "..." : "Agregar aporte"}
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

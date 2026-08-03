"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { addPayment } from "@/application/debts/manage-debts";
import { Button } from "@/components/ui/button";

export function NewPaymentButton({ debtId }: { debtId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await addPayment(debtId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pago registrado");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? "Guardando..." : "Nuevo pago"}
    </Button>
  );
}

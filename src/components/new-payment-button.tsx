"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { addPayment } from "@/application/debts/manage-debts";
import { Button } from "@/components/ui/button";

export function NewPaymentButton({
  debtId,
  installmentsOverdue = 0,
}: {
  debtId: string;
  installmentsOverdue?: number;
}) {
  const [pending, startTransition] = useTransition();
  const catchingUp = installmentsOverdue > 0;

  function handleClick() {
    startTransition(async () => {
      const result = await addPayment(debtId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(catchingUp ? "Cuota atrasada pagada" : "Pago registrado");
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
      {pending ? "Guardando..." : catchingUp ? "Pagar cuota atrasada" : "Nuevo pago"}
    </Button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { importFromMercadoPago } from "@/application/incomes/manage-incomes";
import type { MercadoPagoPayment } from "@/application/mercadopago/fetch-payments";
import { formatCLP } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MercadoPagoPaymentRow({
  payment,
  alreadyImported,
}: {
  payment: MercadoPagoPayment;
  alreadyImported: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [imported, setImported] = useState(alreadyImported);

  function handleImport() {
    startTransition(async () => {
      const result = await importFromMercadoPago(payment.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setImported(true);
        toast.success("Ingreso agregado");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{payment.description ?? `Pago #${payment.id}`}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {payment.operationType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {payment.dateApproved?.slice(0, 10) ?? "-"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{formatCLP(payment.amount)}</span>
          {imported ? (
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3" />
              Agregado
            </Badge>
          ) : (
            <Button type="button" size="sm" onClick={handleImport} disabled={pending}>
              {pending ? "..." : "Agregar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

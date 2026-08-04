import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRecentReceivedPayments } from "@/application/mercadopago/fetch-payments";
import { getIncomes } from "@/application/incomes/manage-incomes";
import { MercadoPagoPaymentRow } from "@/components/mercadopago-payment-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Importar de Mercado Pago",
};

export default async function MercadoPagoImportPage() {
  const [incomes, paymentsResult] = await Promise.all([
    getIncomes(200),
    getRecentReceivedPayments(20).then(
      (data) => ({ ok: true as const, data }),
      (err: Error) => ({ ok: false as const, error: err.message })
    ),
  ]);

  const importedIds = new Set(
    incomes.map((income) => income.mercadopagoPaymentId).filter((id): id is string => id !== null)
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center gap-2">
        <Link
          href="/ingresos"
          aria-label="Volver a Ingresos"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Mercado Pago</h1>
      </div>

      {!paymentsResult.ok ? (
        <p className="rounded-lg bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
          {paymentsResult.error}
        </p>
      ) : paymentsResult.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay pagos recientes en tu cuenta de Mercado Pago.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {paymentsResult.data.map((payment) => (
            <MercadoPagoPaymentRow
              key={payment.id}
              payment={payment}
              alreadyImported={importedIds.has(String(payment.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

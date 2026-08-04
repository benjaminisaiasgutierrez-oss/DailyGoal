import type { Metadata } from "next";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { getIncomes } from "@/application/incomes/manage-incomes";
import { formatCLP } from "@/lib/format";
import { IncomeFormDialog } from "@/components/income-form-dialog";
import { IncomeRow } from "@/components/income-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ingresos",
};

export default async function IngresosPage() {
  const incomes = await getIncomes();
  const total = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Ingresos</h1>
          <p className="text-sm text-muted-foreground">Total registrado: {formatCLP(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ingresos/mercadopago"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            aria-label="Importar de Mercado Pago"
          >
            <Landmark className="size-4" />
          </Link>
          <IncomeFormDialog />
        </div>
      </div>

      {incomes.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavía no agregas ningún ingreso.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {incomes.map((income) => (
          <IncomeRow key={income.id} income={income} />
        ))}
      </div>
    </div>
  );
}

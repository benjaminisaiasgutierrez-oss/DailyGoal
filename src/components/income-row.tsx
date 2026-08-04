import { Trash2 } from "lucide-react";
import type { Income } from "@/domain/entities/income";
import { INCOME_TYPE_LABELS } from "@/domain/entities/income";
import { formatCLP } from "@/lib/format";
import { deleteIncome } from "@/application/incomes/manage-incomes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncomeFormDialog } from "@/components/income-form-dialog";

export function IncomeRow({ income }: { income: Income }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{income.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {INCOME_TYPE_LABELS[income.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {income.isRecurring ? `Fijo · día ${income.paymentDay}` : income.incomeDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{formatCLP(income.amount)}</span>
          <IncomeFormDialog income={income} />
          <form action={deleteIncome.bind(null, income.id)}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar ingreso">
              <Trash2 className="size-3.5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

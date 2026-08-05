import { Archive, Calendar } from "lucide-react";
import type { Debt } from "@/domain/entities/debt";
import { DEBT_TYPE_LABELS } from "@/domain/entities/debt";
import { isDebtFinished, calculateRemainingBalance } from "@/domain/finance/calculations";
import { formatCLP } from "@/lib/format";
import { archiveDebt, deleteDebt } from "@/application/debts/manage-debts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DebtFormDialog } from "@/components/debt-form-dialog";
import { NewPaymentButton } from "@/components/new-payment-button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export function DebtCard({ debt, isOverdue = false }: { debt: Debt; isOverdue?: boolean }) {
  const finished = isDebtFinished(debt);
  const remaining = calculateRemainingBalance(debt);
  const progress =
    debt.totalInstallments !== null
      ? Math.min((debt.installmentsPaid / debt.totalInstallments) * 100, 100)
      : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{debt.name}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="w-fit">
                {DEBT_TYPE_LABELS[debt.type]}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="w-fit">
                  Atrasado
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DebtFormDialog debt={debt} />
            {finished && (
              <form action={archiveDebt.bind(null, debt.id)}>
                <Button type="submit" variant="ghost" size="icon-sm" aria-label="Archivar">
                  <Archive className="size-3.5" />
                </Button>
              </form>
            )}
            <ConfirmDeleteButton
              action={deleteDebt.bind(null, debt.id)}
              confirmMessage={`¿Eliminar "${debt.name}"? Esta acción no se puede deshacer.`}
              label="Eliminar gasto"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Cuota</span>
          <span className="font-medium">{formatCLP(debt.amount)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>Vence el día {debt.dueDay} de cada mes</span>
        </div>

        {progress !== null ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {debt.installmentsPaid} de {debt.totalInstallments} cuotas
              </span>
              {remaining !== null && <span>Quedan {formatCLP(remaining)}</span>}
            </div>
            <Progress value={progress} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Recurrente indefinido</p>
        )}

        {!finished && <NewPaymentButton debtId={debt.id} />}
        {finished && <p className="text-center text-xs text-muted-foreground">Pagado por completo</p>}
      </CardContent>
    </Card>
  );
}

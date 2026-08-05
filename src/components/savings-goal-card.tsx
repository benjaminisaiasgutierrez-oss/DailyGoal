import { formatCLP } from "@/lib/format";
import type { SavingsGoal } from "@/domain/entities/savings-goal";
import { deleteSavingsGoal } from "@/application/savings/manage-savings";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SavingsGoalFormDialog } from "@/components/savings-goal-form-dialog";
import { AddContributionForm } from "@/components/add-contribution-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const progress =
    goal.targetAmount && goal.targetAmount > 0
      ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
      : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium">{goal.name}</span>
          <div className="flex items-center gap-1">
            <SavingsGoalFormDialog goal={goal} />
            <ConfirmDeleteButton
              action={deleteSavingsGoal.bind(null, goal.id)}
              confirmMessage={`¿Eliminar la meta "${goal.name}"? Esta acción no se puede deshacer.`}
              label="Eliminar meta"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Ahorrado</span>
          <span className="font-medium">{formatCLP(goal.savedAmount)}</span>
        </div>

        {progress !== null ? (
          <>
            <Progress value={progress} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Meta {formatCLP(goal.targetAmount ?? 0)}</span>
              <span>
                Faltan {formatCLP(Math.max((goal.targetAmount ?? 0) - goal.savedAmount, 0))}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Sin meta definida todavía.</p>
        )}

        {goal.targetDate && (
          <span className="text-xs text-muted-foreground">Objetivo: {goal.targetDate}</span>
        )}

        <AddContributionForm goalId={goal.id} />
      </CardContent>
    </Card>
  );
}

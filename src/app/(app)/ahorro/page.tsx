import type { Metadata } from "next";
import { getSavingsGoals } from "@/application/savings/manage-savings";
import { SavingsGoalCard } from "@/components/savings-goal-card";
import { SavingsGoalFormDialog } from "@/components/savings-goal-form-dialog";

export const metadata: Metadata = {
  title: "Ahorro",
};

export default async function AhorroPage() {
  const goals = await getSavingsGoals();

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Ahorro</h1>
        <SavingsGoalFormDialog />
      </div>

      {goals.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavía no tienes metas de ahorro. Crea la primera.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <SavingsGoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}

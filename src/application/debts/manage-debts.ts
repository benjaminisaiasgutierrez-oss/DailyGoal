"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";
import { mapDebt } from "@/infrastructure/persistence/mappers";
import type { Debt, DebtType } from "@/domain/entities/debt";
import { isDebtOwingThisMonth } from "@/domain/finance/calculations";
import { currentMonthRange } from "@/lib/date";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function firstOfMonthISO(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function lastOfMonthISO(year: number, month: number): string {
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Meses (inclusive `from`, exclusive `to`) — los que ya pasaron completos
// y todavía no se revisaron.
function monthsBetween(
  from: { year: number; month: number },
  to: { year: number; month: number }
): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  let year = from.year;
  let month = from.month;
  while (year < to.year || (year === to.year && month < to.month)) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

// Si pasó un mes completo sin ningún pago registrado para un gasto activo,
// le suma +1 a installments_overdue por cada mes así, automáticamente. La
// primera vez que ve un gasto (last_overdue_check en null) solo marca el
// mes actual como punto de partida, sin retroactividad — para no inventar
// atraso de meses anteriores a que esto existiera.
async function reconcileOverdueInstallments(
  supabase: SupabaseServerClient,
  userId: string,
  debts: Debt[],
  lastOverdueCheckById: Map<string, string | null>
): Promise<void> {
  const { year: curYear, month: curMonth } = currentMonthRange();
  const owing = debts.filter(isDebtOwingThisMonth);
  if (owing.length === 0) return;

  const needsFirstCheck: Debt[] = [];
  const needsElapsedCheck: { debt: Debt; elapsed: { year: number; month: number }[] }[] = [];

  for (const debt of owing) {
    const lastCheck = lastOverdueCheckById.get(debt.id) ?? null;
    if (lastCheck === null) {
      needsFirstCheck.push(debt);
      continue;
    }
    const [checkYear, checkMonth] = lastCheck.split("-").map(Number);
    const elapsed = monthsBetween(
      { year: checkYear, month: checkMonth },
      { year: curYear, month: curMonth }
    );
    if (elapsed.length > 0) {
      needsElapsedCheck.push({ debt, elapsed });
    }
  }

  // Primera vez que se revisa este gasto: solo marca el mes actual como
  // punto de partida, sin retroactividad.
  for (const debt of needsFirstCheck) {
    await supabase
      .from("debts")
      .update({ last_overdue_check: firstOfMonthISO(curYear, curMonth) })
      .eq("id", debt.id)
      .eq("user_id", userId);
  }

  if (needsElapsedCheck.length === 0) return;

  const { data: payments } = await supabase
    .from("debt_payments")
    .select("debt_id, paid_at")
    .in(
      "debt_id",
      needsElapsedCheck.map(({ debt }) => debt.id)
    );

  const paymentDatesByDebt = new Map<string, string[]>();
  for (const payment of payments ?? []) {
    const list = paymentDatesByDebt.get(payment.debt_id) ?? [];
    list.push(payment.paid_at as string);
    paymentDatesByDebt.set(payment.debt_id, list);
  }

  for (const { debt, elapsed } of needsElapsedCheck) {
    const paidDates = paymentDatesByDebt.get(debt.id) ?? [];
    let newlyOverdue = 0;
    for (const { year, month } of elapsed) {
      const from = firstOfMonthISO(year, month);
      const to = `${lastOfMonthISO(year, month)}T23:59:59`;
      const paidThatMonth = paidDates.some((date) => date >= from && date <= to);
      if (!paidThatMonth) newlyOverdue += 1;
    }

    const updates: Record<string, number | string> = {
      last_overdue_check: firstOfMonthISO(curYear, curMonth),
    };
    if (newlyOverdue > 0) {
      debt.installmentsOverdue += newlyOverdue;
      updates.installments_overdue = debt.installmentsOverdue;
    }

    await supabase.from("debts").update(updates).eq("id", debt.id).eq("user_id", userId);
  }
}

export async function getDebts(): Promise<Debt[]> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) throw new Error("No se pudieron cargar los gastos.");
  const rows = data ?? [];
  const debts = rows.map(mapDebt);

  const lastOverdueCheckById = new Map(
    rows.map((row) => [row.id as string, (row.last_overdue_check as string | null) ?? null])
  );
  await reconcileOverdueInstallments(supabase, userId, debts, lastOverdueCheckById);

  return debts;
}

// IDs de gastos que ya tienen al menos un pago registrado este mes —
// se usa para marcar cuáles quedaron "Atrasados".
export async function getDebtIdsPaidThisMonth(): Promise<Set<string>> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { first: firstOfMonth } = currentMonthRange();

  const { data, error } = await supabase
    .from("debt_payments")
    .select("debt_id, debts!inner(user_id)")
    .eq("debts.user_id", userId)
    .gte("paid_at", firstOfMonth);

  if (error) throw new Error("No se pudo revisar el estado de los pagos.");
  return new Set((data ?? []).map((row) => row.debt_id as string));
}

export type DebtFormState = { error?: string } | undefined;

function parseDebtForm(formData: FormData):
  | {
      ok: true;
      value: {
        name: string;
        type: DebtType;
        amount: number;
        dueDay: number;
        totalInstallments: number | null;
        installmentsPaid: number;
        installmentsOverdue: number;
      };
    }
  | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "otro") as DebtType;
  const amount = Number(formData.get("amount"));
  const dueDay = Number(formData.get("dueDay"));
  const totalInstallmentsRaw = String(formData.get("totalInstallments") ?? "").trim();
  const totalInstallments = totalInstallmentsRaw ? Number(totalInstallmentsRaw) : null;
  const installmentsPaidRaw = String(formData.get("installmentsPaid") ?? "").trim();
  const installmentsPaid = installmentsPaidRaw ? Number(installmentsPaidRaw) : 0;
  const installmentsOverdueRaw = String(formData.get("installmentsOverdue") ?? "").trim();
  const installmentsOverdue = installmentsOverdueRaw ? Number(installmentsOverdueRaw) : 0;

  if (!name) return { ok: false, error: "Ingresa un nombre." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Ingresa un monto válido." };
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return { ok: false, error: "El día de pago debe estar entre 1 y 31." };
  }
  if (totalInstallments !== null && (!Number.isInteger(totalInstallments) || totalInstallments <= 0)) {
    return { ok: false, error: "La cantidad de cuotas debe ser un número mayor a 0, o déjalo vacío." };
  }
  if (!Number.isInteger(installmentsPaid) || installmentsPaid < 0) {
    return { ok: false, error: "Las cuotas pagadas deben ser un número de 0 o más." };
  }
  if (totalInstallments !== null && installmentsPaid > totalInstallments) {
    return { ok: false, error: "Las cuotas pagadas no pueden ser más que el total de cuotas." };
  }
  if (!Number.isInteger(installmentsOverdue) || installmentsOverdue < 0) {
    return { ok: false, error: "Las cuotas atrasadas deben ser un número de 0 o más." };
  }

  return {
    ok: true,
    value: { name, type, amount, dueDay, totalInstallments, installmentsPaid, installmentsOverdue },
  };
}

export async function createDebt(_prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const { userId } = await verifySession();
  const parsed = parseDebtForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("debts").insert({
    user_id: userId,
    name: parsed.value.name,
    type: parsed.value.type,
    amount: parsed.value.amount,
    due_day: parsed.value.dueDay,
    total_installments: parsed.value.totalInstallments,
    installments_paid: parsed.value.installmentsPaid,
    installments_overdue: parsed.value.installmentsOverdue,
  });

  if (error) return { error: "No se pudo guardar el gasto." };

  revalidatePath("/gastos");
  revalidatePath("/");
  return undefined;
}

export async function updateDebt(_prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Gasto no encontrado." };

  const parsed = parseDebtForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .update({
      name: parsed.value.name,
      type: parsed.value.type,
      amount: parsed.value.amount,
      due_day: parsed.value.dueDay,
      total_installments: parsed.value.totalInstallments,
      installments_paid: parsed.value.installmentsPaid,
      installments_overdue: parsed.value.installmentsOverdue,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: "No se pudo actualizar el gasto." };

  revalidatePath("/gastos");
  revalidatePath("/");
  return undefined;
}

export async function archiveDebt(debtId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("debts").update({ active: false }).eq("id", debtId).eq("user_id", userId);
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function deleteDebt(debtId: string): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("debts").delete().eq("id", debtId).eq("user_id", userId);
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function addPayment(debtId: string): Promise<{ error?: string }> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("installments_paid, total_installments, installments_overdue, amount")
    .eq("id", debtId)
    .eq("user_id", userId)
    .single();

  if (debtError || !debt) return { error: "Gasto no encontrado." };

  // Si hay cuotas atrasadas declaradas, el pago las descuenta primero
  // (y sigue sumando al conteo normal de cuotas pagadas).
  if (debt.installments_overdue > 0) {
    const nextInstallment = debt.installments_paid + 1;
    const stillFinished =
      debt.total_installments !== null && nextInstallment > debt.total_installments;

    const { error: paymentError } = await supabase.from("debt_payments").insert({
      debt_id: debtId,
      installment_number: nextInstallment,
      amount: debt.amount,
    });
    if (paymentError) return { error: "No se pudo registrar el pago." };

    const { error: updateError } = await supabase
      .from("debts")
      .update({
        installments_overdue: debt.installments_overdue - 1,
        installments_paid: stillFinished ? debt.installments_paid : nextInstallment,
      })
      .eq("id", debtId)
      .eq("user_id", userId);
    if (updateError) return { error: "El pago quedó registrado pero no se pudo actualizar el conteo." };

    revalidatePath("/gastos");
    revalidatePath("/");
    return {};
  }

  if (debt.total_installments !== null && debt.installments_paid >= debt.total_installments) {
    return { error: "Este gasto ya está pagado por completo." };
  }

  const nextInstallment = debt.installments_paid + 1;

  const { error: paymentError } = await supabase.from("debt_payments").insert({
    debt_id: debtId,
    installment_number: nextInstallment,
    amount: debt.amount,
  });
  if (paymentError) return { error: "No se pudo registrar el pago." };

  const { error: updateError } = await supabase
    .from("debts")
    .update({ installments_paid: nextInstallment })
    .eq("id", debtId)
    .eq("user_id", userId);
  if (updateError) return { error: "El pago quedó registrado pero no se pudo actualizar el conteo." };

  revalidatePath("/gastos");
  revalidatePath("/");
  return {};
}

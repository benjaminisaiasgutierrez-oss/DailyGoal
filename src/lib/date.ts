const APP_TIMEZONE = "America/Santiago";

// "Hoy" en la zona horaria de la app, no en UTC ni en la zona del servidor.
// new Date().toISOString() convierte a UTC antes de tomar la fecha, lo que
// da la fecha de mañana durante buena parte de la noche en Chile.
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}

export function todayDayOfMonth(): number {
  return Number(todayISO().slice(8, 10));
}

export function currentMonthRange(): {
  year: number;
  month: number;
  first: string;
  last: string;
  today: string;
} {
  const today = todayISO();
  const [year, month] = today.split("-").map(Number);
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const last = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { year, month, first, last, today };
}

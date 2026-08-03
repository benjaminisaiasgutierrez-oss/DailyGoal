export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

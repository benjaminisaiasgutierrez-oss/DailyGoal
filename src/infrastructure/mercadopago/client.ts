import "server-only";

const MP_API_BASE = "https://api.mercadopago.com";

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN en .env.");
  }
  return token;
}

export async function mercadoPagoFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${MP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Mercado Pago respondió ${res.status} para ${path}`);
  }

  return res.json() as Promise<T>;
}

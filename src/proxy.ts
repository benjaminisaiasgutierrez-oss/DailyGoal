import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.googleusercontent.com;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://accounts.google.com;
    frame-src 'self' https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  return cspHeader.replace(/\s{2,}/g, " ").trim();
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(path);

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let isAuthenticated = false;

  // Si todavía no se configuró Supabase en .env, no reventamos el proxy:
  // se trata como "sin sesión" (se puede ver /login, el resto redirige ahí).
  if (supabaseUrl && supabaseKey) {
    // Cliente de Supabase atado a las cookies de este request: refresca la
    // sesión si el access token expiró y propaga las cookies nuevas tanto al
    // request (para Server Components) como a la respuesta (para el navegador).
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // getClaims() valida la firma del JWT contra las llaves públicas del
    // proyecto en cada request — a diferencia de getSession(), no confía
    // ciegamente en la cookie.
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
  }

  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons/|icon|apple-icon|manifest.webmanifest|favicon.ico).*)",
  ],
};

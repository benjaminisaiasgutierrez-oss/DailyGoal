"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { createClient } from "@/infrastructure/persistence/supabase-browser";
import "./google-login.css";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            nonce: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function b64urlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return b64urlEncode(arr);
}

async function sha256Hex(value: string) {
  const enc = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function GoogleLogin({ nonce }: { nonce?: string }) {
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const googleNonceRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowLogin(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleGoogleCredential(response: { credential: string }) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce: googleNonceRef.current ?? undefined,
      });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
      setPending(false);
    }
  }

  async function initGoogleSignIn() {
    if (!window.google?.accounts?.id) return false;
    const rawNonce = generateNonce();
    googleNonceRef.current = rawNonce;
    const hashed = await sha256Hex(rawNonce);
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      nonce: hashed,
      use_fedcm_for_prompt: true,
    });
    return true;
  }

  async function loginGoogle() {
    setError("");
    if (!GOOGLE_CLIENT_ID) {
      setError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID en .env.");
      return;
    }
    setPending(true);
    const ready = await initGoogleSignIn();
    if (!ready) {
      setError("No se pudo cargar el servicio de Google. Intenta de nuevo.");
      setPending(false);
      return;
    }
    window.google!.accounts.id.prompt();
    setPending(false);
  }

  return (
    <div className="gl-root">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        nonce={nonce}
      />

      <div className={`gl-splash${showLogin ? " hide" : ""}`}>
        <div className="gl-sp-logo">
          <span className="gl-sp-w1">Daily</span>
          <span className="gl-sp-w2">Goal</span>
        </div>
        <div className="gl-sp-bar">
          <div className="gl-sp-shimmer" />
        </div>
      </div>

      <div className={`gl-login${showLogin ? " show" : ""}`}>
        <div className="gl-brand">
          <div className="gl-brand-logo">
            <span className="gl-l1">Daily</span>
            <span className="gl-l2">Goal</span>
          </div>
        </div>

        <div className="gl-heading">Bienvenido</div>
        <div className="gl-subheading">Inicia sesión para seguir tus metas diarias</div>

        {error && (
          <div role="alert" className="gl-error-box">
            {error}
          </div>
        )}

        <button type="button" className="gl-btn-google" onClick={loginGoogle} disabled={pending}>
          <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          {pending ? "Conectando…" : "Continuar con Google"}
        </button>
      </div>
    </div>
  );
}

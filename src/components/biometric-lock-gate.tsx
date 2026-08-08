"use client";

import { useEffect, useState, useTransition } from "react";
import { Fingerprint } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  startBiometricAuthentication,
  finishBiometricAuthentication,
} from "@/application/auth/manage-biometric";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "dg_unlocked";

export function BiometricLockGate({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [checked, setChecked] = useState(!enabled);
  const [unlocked, setUnlocked] = useState(!enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) return;
    setUnlocked(sessionStorage.getItem(SESSION_KEY) === "1");
    setChecked(true);
  }, [enabled]);

  function handleUnlock() {
    setError(null);
    startTransition(async () => {
      const started = await startBiometricAuthentication();
      if ("error" in started) {
        setError(started.error);
        return;
      }

      let response;
      try {
        response = await startAuthentication({ optionsJSON: started.options });
      } catch {
        setError("No se pudo leer la huella. Intenta de nuevo.");
        return;
      }

      const finished = await finishBiometricAuthentication(response);
      if (!finished.verified) {
        setError(finished.error ?? "No se pudo verificar la huella.");
        return;
      }

      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    });
  }

  if (!checked) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Fingerprint className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold">DailyGoal está bloqueada</span>
        <span className="text-sm text-muted-foreground">
          Usa tu huella o Face ID para continuar
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button onClick={handleUnlock} disabled={pending}>
        {pending ? "Verificando..." : "Desbloquear"}
      </Button>
    </div>
  );
}

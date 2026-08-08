"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { startRegistration, platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import {
  startBiometricRegistration,
  finishBiometricRegistration,
  disableBiometricLock,
} from "@/application/auth/manage-biometric";
import { Button } from "@/components/ui/button";

export function BiometricSettings({ enabled }: { enabled: boolean }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    platformAuthenticatorIsAvailable()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  function handleEnable() {
    startTransition(async () => {
      const started = await startBiometricRegistration();
      if ("error" in started) {
        toast.error(started.error);
        return;
      }

      let response;
      try {
        response = await startRegistration({ optionsJSON: started.options });
      } catch {
        toast.error("No se pudo leer la huella. Intenta de nuevo.");
        return;
      }

      const finished = await finishBiometricRegistration(response);
      if (finished.error) {
        toast.error(finished.error);
        return;
      }
      toast.success("Bloqueo con huella activado");
    });
  }

  function handleDisable() {
    startTransition(async () => {
      await disableBiometricLock();
      toast.success("Bloqueo con huella desactivado");
    });
  }

  if (available === false) {
    return (
      <p className="text-sm text-muted-foreground">
        Este dispositivo no tiene huella, Face ID o PIN configurado, así que no se puede activar.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">Bloqueo con huella</span>
        <span className="text-xs text-muted-foreground">
          Pide huella o Face ID cada vez que abres la app.
        </span>
      </div>
      <Button
        type="button"
        variant={enabled ? "outline" : "default"}
        size="sm"
        disabled={pending || available === null}
        onClick={enabled ? handleDisable : handleEnable}
      >
        {enabled ? "Desactivar" : "Activar"}
      </Button>
    </div>
  );
}

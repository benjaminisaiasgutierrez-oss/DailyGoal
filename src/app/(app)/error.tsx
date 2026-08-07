"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <AlertTriangle className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">No pudimos cargar tus datos.</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Puede ser un problema pasajero de conexión. Intenta de nuevo en unos segundos.
      </p>
      <Button type="button" onClick={reset} className="mt-2">
        Reintentar
      </Button>
    </div>
  );
}

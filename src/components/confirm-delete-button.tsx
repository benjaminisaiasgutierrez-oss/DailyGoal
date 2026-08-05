"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  label = "Eliminar",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await action();
      } catch {
        toast.error("No se pudo eliminar.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={handleClick}
      disabled={pending}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

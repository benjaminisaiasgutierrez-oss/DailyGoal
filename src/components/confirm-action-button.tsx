"use client";

import { useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConfirmActionButton({
  action,
  confirmMessage,
  label,
  icon: Icon,
  errorMessage = "No se pudo completar la acción.",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  icon: LucideIcon;
  errorMessage?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await action();
      } catch {
        toast.error(errorMessage);
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
      <Icon className="size-3.5" />
    </Button>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  label = "Eliminar",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <ConfirmActionButton
      action={action}
      confirmMessage={confirmMessage}
      label={label}
      icon={Trash2}
      errorMessage="No se pudo eliminar."
    />
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

// Deshabilita el botón mientras el <form> que lo contiene está enviando,
// sin necesidad de convertir esa página/Server Component en cliente.
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

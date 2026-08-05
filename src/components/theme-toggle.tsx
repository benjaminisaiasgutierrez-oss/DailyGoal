"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

// Evita el desajuste de hidratación: en el servidor no se conoce el tema
// guardado en el navegador, así que se renderiza un estado neutro hasta
// que React confirme que ya estamos montados en el cliente.
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-8 w-28" />;
  }

  const isDark = theme === "dark";

  return (
    <Button type="button" variant="outline" onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      {isDark ? "Oscuro" : "Claro"}
    </Button>
  );
}

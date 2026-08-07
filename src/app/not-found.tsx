import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-2xl font-semibold tracking-tight">404</p>
      <p className="text-sm text-muted-foreground">Esta página no existe.</p>
      <Link href="/" className={cn(buttonVariants({ variant: "default" }), "mt-2")}>
        Volver al inicio
      </Link>
    </div>
  );
}

import { ShieldCheck, LogOut } from "lucide-react";
import { getCurrentUser } from "@/application/auth/get-session";
import { logout } from "@/application/auth/authenticate-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">DailyGoal</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Sesión iniciada{user?.name ? `, ${user.name}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Conectado como <span className="text-foreground">{user?.email}</span>. Esta es la
            base del proyecto — las funciones propias de DailyGoal se construyen en la
            siguiente etapa.
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="size-4" />
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

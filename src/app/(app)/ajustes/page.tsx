import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/application/auth/get-session";
import { logout } from "@/application/auth/authenticate-user";
import { getUserSettings } from "@/application/uber/manage-uber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { GeneralSettingsForm } from "@/components/general-settings-form";
import { BiometricSettings } from "@/components/biometric-settings";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = {
  title: "Ajustes",
};

export default async function AjustesPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getUserSettings()]);

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <span className="text-sm font-medium">{user?.name ?? "Sin nombre"}</span>
          <span className="text-sm text-muted-foreground">{user?.email}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <BiometricSettings enabled={settings.biometricLockEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uber</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralSettingsForm settings={settings} />
        </CardContent>
      </Card>

      <form action={logout}>
        <SubmitButton variant="outline" className="w-full" pendingLabel="Cerrando sesión...">
          <LogOut className="size-4" />
          Cerrar sesión
        </SubmitButton>
      </form>
    </div>
  );
}

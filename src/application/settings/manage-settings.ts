"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession } from "@/application/auth/get-session";

export type SettingsFormState = { error?: string } | undefined;

export async function updateGeneralSettings(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const { userId } = await verifySession();

  const uberModeEnabled = formData.get("uberModeEnabled") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      uber_mode_enabled: uberModeEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/ajustes");
  revalidatePath("/");
  revalidatePath("/uber");
  return undefined;
}

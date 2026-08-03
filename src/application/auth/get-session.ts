import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import type { User } from "@/domain/entities/user";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const metadata = (data.claims.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (metadata.full_name as string | undefined) ?? (metadata.name as string | undefined) ?? null;

  return {
    id: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? "",
    name,
  };
});

export const verifySession = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return { isAuth: true, userId: user.id };
});

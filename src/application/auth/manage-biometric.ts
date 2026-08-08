"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type WebAuthnCredential,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createClient } from "@/infrastructure/persistence/supabase-server";
import { verifySession, getCurrentUser } from "@/application/auth/get-session";

const CHALLENGE_COOKIE = "dg_webauthn_challenge";
const RP_NAME = "DailyGoal";

type CredentialRow = {
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[];
};

// El rpID/origin se derivan del host de la petición en vez de estar fijos,
// para que funcione igual en localhost y en el dominio real desplegado.
async function rpConfig() {
  const host = (await headers()).get("host") ?? "localhost";
  const hostname = host.split(":")[0];
  const protocol = hostname === "localhost" ? "http" : "https";
  return { rpID: hostname, origin: `${protocol}://${host}` };
}

async function setChallenge(challenge: string) {
  (await cookies()).set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
}

async function popChallenge(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CHALLENGE_COOKIE)?.value ?? null;
  store.delete(CHALLENGE_COOKIE);
  return value;
}

export async function startBiometricRegistration(): Promise<
  { options: PublicKeyCredentialCreationOptionsJSON } | { error: string }
> {
  const { userId } = await verifySession();
  const user = await getCurrentUser();
  const { rpID } = await rpConfig();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, transports")
    .eq("user_id", userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(userId),
    userName: user?.email ?? userId,
    userDisplayName: user?.name ?? user?.email ?? "Usuario",
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((row) => ({
      id: row.credential_id,
      transports: row.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });

  await setChallenge(options.challenge);
  return { options };
}

export async function finishBiometricRegistration(
  response: RegistrationResponseJSON
): Promise<{ error?: string }> {
  const { userId } = await verifySession();
  const { rpID, origin } = await rpConfig();
  const expectedChallenge = await popChallenge();
  if (!expectedChallenge) return { error: "La solicitud expiró, intenta de nuevo." };

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch {
    return { error: "No se pudo verificar la huella." };
  }

  if (!verification.verified) {
    return { error: "No se pudo verificar la huella." };
  }

  const { credential } = verification.registrationInfo;
  const supabase = await createClient();
  const { error } = await supabase.from("webauthn_credentials").insert({
    user_id: userId,
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
  });
  if (error) return { error: "No se pudo guardar la credencial." };

  await supabase
    .from("user_settings")
    .upsert({ user_id: userId, biometric_lock_enabled: true }, { onConflict: "user_id" });

  revalidatePath("/ajustes");
  return {};
}

export async function startBiometricAuthentication(): Promise<
  { options: PublicKeyCredentialRequestOptionsJSON } | { error: string }
> {
  const { userId } = await verifySession();
  const { rpID } = await rpConfig();

  const supabase = await createClient();
  const { data: credentials } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, transports")
    .eq("user_id", userId);

  if (!credentials || credentials.length === 0) {
    return { error: "No tienes huella configurada." };
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: credentials.map((row) => ({
      id: row.credential_id,
      transports: row.transports as AuthenticatorTransportFuture[],
    })),
  });

  await setChallenge(options.challenge);
  return { options };
}

export async function finishBiometricAuthentication(
  response: AuthenticationResponseJSON
): Promise<{ verified: boolean; error?: string }> {
  const { userId } = await verifySession();
  const { rpID, origin } = await rpConfig();
  const expectedChallenge = await popChallenge();
  if (!expectedChallenge) {
    return { verified: false, error: "La solicitud expiró, intenta de nuevo." };
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, public_key, counter, transports")
    .eq("user_id", userId)
    .eq("credential_id", response.id)
    .maybeSingle<CredentialRow>();

  if (!row) return { verified: false, error: "Credencial no reconocida." };

  const credential: WebAuthnCredential = {
    id: row.credential_id,
    publicKey: isoBase64URL.toBuffer(row.public_key),
    counter: Number(row.counter),
    transports: row.transports as AuthenticatorTransportFuture[],
  };

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential,
    });
  } catch {
    return { verified: false, error: "No se pudo verificar la huella." };
  }

  if (!verification.verified) {
    return { verified: false, error: "No se pudo verificar la huella." };
  }

  await supabase
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("user_id", userId)
    .eq("credential_id", response.id);

  return { verified: true };
}

export async function disableBiometricLock(): Promise<void> {
  const { userId } = await verifySession();
  const supabase = await createClient();
  await supabase.from("webauthn_credentials").delete().eq("user_id", userId);
  await supabase
    .from("user_settings")
    .upsert({ user_id: userId, biometric_lock_enabled: false }, { onConflict: "user_id" });
  revalidatePath("/ajustes");
}

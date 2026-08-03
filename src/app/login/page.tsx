import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleLogin } from "@/components/google-login";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return <GoogleLogin nonce={nonce} />;
}

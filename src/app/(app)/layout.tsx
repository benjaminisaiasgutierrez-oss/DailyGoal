import { getUserSettings } from "@/application/uber/manage-uber";
import { BottomNav } from "@/components/bottom-nav";
import { BiometricLockGate } from "@/components/biometric-lock-gate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUserSettings();

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <BiometricLockGate enabled={settings.biometricLockEnabled}>
        {children}
        <BottomNav uberModeEnabled={settings.uberModeEnabled} />
      </BiometricLockGate>
    </div>
  );
}

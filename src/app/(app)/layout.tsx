import { getUserSettings } from "@/application/uber/manage-uber";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUserSettings();

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      {children}
      <BottomNav uberModeEnabled={settings.uberModeEnabled} />
    </div>
  );
}

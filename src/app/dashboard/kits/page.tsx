// app/dashboard/kits/page.tsx
import DashboardShell from "@/app/_components/DashboardShell";
import KitsManager from "@/components/kits/KitsManager";

export default function KitsPage() {
  return (
    <DashboardShell title="Administrar Kits">
      <KitsManager />
    </DashboardShell>
  );
}
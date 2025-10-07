import DashboardShell from "./_components/DashboardShell";
import Welcome from "@/components/ui/Welcome";

export default function Page() {
  return (
    <DashboardShell title="Inicio">
      <div className="rounded-md border border-subtle bg-panel">
        <Welcome />

      </div>
    </DashboardShell>
  );
}

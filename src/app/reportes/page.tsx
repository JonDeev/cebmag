import DashboardShell from "../_components/DashboardShell";

export default function Page() {
  const title = "Informe";
  return (
    <DashboardShell title={title}>
      <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)] p-6">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-slate-600">Vista inicial sin backend (placeholder).</p>
      </div>
    </DashboardShell>
  );
}
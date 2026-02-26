// src/app/dashboard/page.tsx
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex flex-wrap gap-3 mt-4">
        <Link className="px-3 py-2 border rounded" href="/usuarios">Usuarios</Link>
        <Link className="px-3 py-2 border rounded" href="/roles">Roles</Link>
        <Link className="px-3 py-2 border rounded" href="/pqrs">PQRS</Link>
        <Link className="px-3 py-2 border rounded" href="/costos">Costos</Link>
        <Link className="px-3 py-2 border rounded" href="/entregas">Entregas</Link>
        <Link className="px-3 py-2 border rounded" href="/inscripciones">Inscripciones</Link>
      </div>
    </div>
  );
}
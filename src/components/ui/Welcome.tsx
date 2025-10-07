import { Settings } from "lucide-react";

export default function Welcome() {
  return (
    <div className="max-w-3xl mx-auto py-16 text-center">
      {/* Logo + nombre CEBMAG */}
      <div className="mx-auto mb-4 w-28 h-28 rounded-full bg-white shadow-sm grid place-items-center">
        {/* Marca simple (círculos) para placeholder */}
        <div className="w-14 h-14 rounded-full border-4 border-brand/80" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-700">CEBMAG</h1>
      <p className="mt-1 text-slate-500">Plataforma de gestión de información Online.</p>

      <div className="mt-6 inline-flex items-center gap-2 text-slate-400">
        <Settings size={18} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const t = toast.loading("Iniciando sesión...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo iniciar sesión");

      toast.success("Bienvenido ✅", { id: t });

      // aquí mandas a tu home o dashboard
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Error", { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="w-[min(420px,92vw)] rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-xl">
        <div className="px-5 py-4 border-b border-[var(--subtle)]">
          <div className="text-base font-semibold">Iniciar sesión</div>
          <div className="text-xs text-slate-500">Ingresa con tu usuario y contraseña</div>
        </div>

        <form onSubmit={submit} className="grid gap-3 p-5">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Usuario</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="ej: operador1"
              autoFocus
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
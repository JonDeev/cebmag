"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, User, LogOut } from "lucide-react";
import toast from "react-hot-toast";

type MeResp =
  | { user: { id: number; nombre: string | null; email: string } }
  | { user: null }
  | null;

async function fetchMe(): Promise<MeResp> {
  const res = await fetch(`/api/auth/me?ts=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });

  if (!res.ok) return null;
  return (await res.json()) as MeResp;
}

async function doLogout(): Promise<boolean> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "cache-control": "no-cache" },
  });
  return res.ok;
}

export default function Topbar({ onToggle }: { onToggle(): void }) {
  const router = useRouter();

  const [me, setMe] = useState<MeResp>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingMe(true);
      try {
        const data = await fetchMe();
        if (mounted) setMe(data);
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    me && "user" in me && me.user
      ? me.user.nombre?.trim() || me.user.email
      : "Invitado";

  const logout = async () => {
    setLoggingOut(true);
    const t = toast.loading("Cerrando sesión...");
    try {
      const ok = await doLogout();
      if (!ok) {
        toast.error("No se pudo cerrar sesión", { id: t });
        return;
      }
      toast.success("Sesión cerrada ✅", { id: t });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-[var(--brand)] text-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-2 transition rounded hover:bg-brand-700/50"
          aria-label="Abrir/cerrar menú"
          type="button"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold tracking-wide">CEBMAG</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 transition rounded hover:bg-brand-700/50"
          aria-label="Notificaciones"
          type="button"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
          <div className="grid w-8 h-8 rounded-full bg-white/20 place-items-center">
            <User size={16} />
          </div>

          <div className="flex-col hidden leading-tight sm:flex">
            <span className="text-[12px] opacity-80">Sesión</span>
            <span className="text-sm font-medium">
              {loadingMe ? "Cargando..." : displayName}
            </span>
          </div>

          <button
            onClick={logout}
            disabled={loggingOut}
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 ml-2 text-sm rounded-md bg-white/15 hover:bg-white/20 disabled:opacity-60"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
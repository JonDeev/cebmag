"use client";
import { Menu, Bell, User } from "lucide-react";

export default function Topbar({ onToggle }: { onToggle(): void }) {
  return (
    <header className="sticky top-0 z-40 h-14 bg-[var(--brand)] text-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-brand-700/50 transition"
          aria-label="Abrir/cerrar menú"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold tracking-wide">CEBMAG</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded hover:bg-brand-700/50 transition" aria-label="Notificaciones">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users, ShieldCheck, ClipboardCheck, FileText, MessageSquare, ListChecks, Package, Banknote, BarChart3,
} from "lucide-react";

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  const groups: { title: string; items: { href: string; label: string; icon: React.ReactNode }[] }[] = [
    {
      title: "GESTIÓN",
      items: [
        { href: "/beneficiarios", label: "Beneficiarios", icon: <Users size={18} /> },
        { href: "/inscripciones", label: "Inscripciones y contratos", icon: <ClipboardCheck size={18} /> },
        { href: "/pqrs", label: "PQRS", icon: <MessageSquare size={18} /> },
        { href: "/encuestas", label: "Encuestas de satisfacción", icon: <ListChecks size={18} /> },
        { href: "/entregas", label: "Entregas de insumos/kits", icon: <Package size={18} /> },
        { href: "/costos", label: "Costos y gastos", icon: <Banknote size={18} /> },
      ],
    },
    {
      title: "REPORTES",
      items: [{ href: "/reportes", label: "Informe", icon: <BarChart3 size={18} /> }],
    },
    {
      title: "ADMINISTRACIÓN",
      items: [{ href: "/usuarios", label: "Usuarios y permisos", icon: <ShieldCheck size={18} /> }],
    },
  ];

  return (
    <aside
      className={`bg-[var(--sidebar)] border-r border-[var(--subtle)] h-[calc(100vh-3.5rem)]
                  sticky top-14 overflow-y-auto transition-all ${collapsed ? "w-14" : "w-64"}`}
    >
      <nav className="py-3 text-[13px] text-slate-700">
        {groups.map((g) => (
          <div key={g.title} className="mb-3">
            {!collapsed && (
              <div className="px-4 pt-4 pb-2 text-[11px] font-semibold text-slate-500">
                {g.title}
              </div>
            )}
            {g.items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-3 px-3 py-2 transition
                    ${collapsed ? "justify-center" : "justify-start"}
                    ${active ? "bg-white text-[var(--brand)] font-medium" : "hover:bg-white"}`}
                >
                  <span className={active ? "text-[var(--brand)]" : "text-slate-600"}>{it.icon}</span>
                  {!collapsed && <span>{it.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

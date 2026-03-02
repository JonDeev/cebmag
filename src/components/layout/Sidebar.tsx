"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  ShieldCheck,
  ClipboardCheck,
  MessageSquare,
  ListChecks,
  Package,
  Banknote,
  BarChart3,
  Boxes
} from "lucide-react";

type Item = { href: string; label: string; Icon: LucideIcon };
type Group = { title: string; items: Item[] };

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const groups: Group[] = [
    {
      title: "GESTIÓN",
      items: [
        { href: "/beneficiarios", label: "Beneficiarios", Icon: Users },
        { href: "/inscripciones", label: "Inscripciones y contratos", Icon: ClipboardCheck },
        { href: "/pqrs", label: "PQRS", Icon: MessageSquare },
        { href: "/encuestas", label: "Encuestas de satisfacción", Icon: ListChecks },
        { href: "/entregas", label: "Entregas de insumos/kits", Icon: Package },
        { href: "/kits", label: "Kits (plantillas)", Icon: Boxes }, 
        { href: "/costos", label: "Costos y gastos", Icon: Banknote },
      ],
    },
    { title: "REPORTES", items: [{ href: "/reportes", label: "Informe", Icon: BarChart3 }] },
    { title: "ADMINISTRACIÓN", items: [{ href: "/usuarios", label: "Usuarios y permisos", Icon: ShieldCheck }] },
  ];

  // Minimal icon style (menos “pesado”)
  const iconProps = {
    size: 18,
    strokeWidth: 1.6,
    absoluteStrokeWidth: true,
  } as const;

  const wCollapsed = 56; // w-14
  const wExpanded = 256; // w-64

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? wCollapsed : wExpanded }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 34, bounce: 0 }
      }
      className="bg-[var(--sidebar)] border-r border-[var(--subtle)]
                 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto overflow-x-hidden"
    >
      <nav className="py-3 text-[13px]">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key={`${g.title}-title`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
                  className="px-4 pt-4 pb-2 text-[11px] font-semibold tracking-wide text-slate-400"
                >
                  {g.title}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-2 space-y-1">
              {g.items.map(({ href, label, Icon }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "group flex items-center rounded-lg",
                      collapsed ? "justify-center px-2 py-2" : "justify-start px-3 py-2",
                      "transition-colors duration-150",
                      active ? "bg-white/80" : "hover:bg-white/60",
                    ].join(" ")}
                  >
                    {/* Icono minimalista + “chip” suave */}
                    <span
                      className={[
                        "grid place-items-center rounded-md",
                        "w-9 h-9",
                        active ? "bg-[var(--brand)]/10" : "bg-transparent",
                      ].join(" ")}
                    >
                      <Icon
                        {...iconProps}
                        className={[
                          "transition-colors duration-150",
                          active ? "text-[var(--brand)]" : "text-slate-500 group-hover:text-slate-700",
                        ].join(" ")}
                      />
                    </span>

                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          key={`${href}-label`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
                          className={[
                            "ml-2 whitespace-nowrap",
                            active ? "text-slate-900 font-medium" : "text-slate-700",
                          ].join(" ")}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </motion.aside>
  );
}
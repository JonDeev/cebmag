"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus,
  Search,
  FileText,
  User,
  Paperclip,
  Clock,
  XCircle,
  Pencil,
  MessageSquare,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import ClosePqrsModal from "@/components/ui/ClosePqrsModal";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import DocumentDropzone from "@/components/files/DocumentDropzone";

/* ========= Tipos (UI) ========= */
type Tipo = "Petición" | "Queja" | "Reclamo" | "Sugerencia";
type Estado = "Abierta" | "En trámite" | "Re Abierto" | "Cerrada";
type Origen = "Beneficiario" | "Tercero";
type Canal = "Web" | "Teléfono" | "Presencial" | "Email";

/** Prisma: PA (no PAS) */
type TipoDoc = "CC" | "TI" | "CE" | "RC" | "PA" | "PEP" | "PPT" | "NIT" | "OTRO";

type Adj = { name: string; size?: number; url?: string; mime?: string };
type Evento = { fecha: string; evento: string; nota?: string };

type Solicitante = {
  tipoDoc?: TipoDoc;
  doc?: string;

  nombres?: string;
  apellidos?: string;

  // compatibilidad legacy
  nombre?: string;

  telefono?: string;
  email?: string;
};

type PQRS = {
  id?: number; // Int
  radicado: string;
  fecha: string; // ISO day
  tipo: Tipo;
  estado: Estado;
  origen: Origen;
  canal: Canal;

  solicitante: Solicitante;

  asunto: string;
  descripcion: string;
  responsable?: string;
  vencimiento?: string; // ISO day

  adjuntos: Adj[];
  historial: Evento[];

  beneficiarioId?: number | null; // Int
};

/* ========= UI helpers ========= */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
  const reduceMotion = useReducedMotion();
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90 disabled:hover:opacity-50"
      : variant === "outline"
      ? "border border-[var(--subtle)] hover:bg-white disabled:hover:bg-transparent"
      : "hover:bg-white disabled:hover:bg-transparent";

  return (
    <motion.button
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={
        reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }
      }
      className={`${base} ${styles} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60 disabled:cursor-not-allowed ${props.className || ""}`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60 disabled:cursor-not-allowed ${props.className || ""}`}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60 disabled:cursor-not-allowed ${props.className || ""}`}
    />
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "sky" | "amber" | "emerald" | "violet" | "rose";
}) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    sky: "bg-sky-100 text-sky-700 border-sky-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string | React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--subtle)] px-4 py-3">
        <div className="text-[var(--brand)]">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ========= Modal (animado) ========= */
type ModalSize = "md" | "lg" | "xl" | "full";
function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  size = "xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: ModalSize;
}) {
  const reduceMotion = useReducedMotion();
  const widthBySize: Record<ModalSize, string> = {
    md: "w-[min(760px,96vw)]",
    lg: "w-[min(1040px,98vw)]",
    xl: "w-[min(1360px,98vw)]",
    full: "w-[96vw]",
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={
                reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }
              }
              className={[
                widthBySize[size],
                "max-h-[94vh] rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-2xl",
                "flex flex-col overflow-hidden",
              ].join(" ")}
            >
              <div className="flex items-center justify-between border-b border-[var(--subtle)] px-6 py-4">
                <h4 className="text-base font-semibold">{title}</h4>
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-slate-100"
                  aria-label="Cerrar"
                  type="button"
                >
                  <XCircle size={18} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">{children}</div>
              <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-6 py-4">
                {actions}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ========= Utilidades ========= */
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (isoDay: string, n: number) => {
  const d = new Date(isoDay + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const estadoTone = (e: Estado) =>
  e === "Abierta" ? "sky" : e === "En trámite" || e === "Re Abierto" ? "amber" : "slate";

const fullName = (s?: Solicitante) => {
  const a = (s?.nombres ?? "").trim();
  const b = (s?.apellidos ?? "").trim();
  const legacy = (s?.nombre ?? "").trim();
  return a || b ? [a, b].filter(Boolean).join(" ") : legacy;
};

const dedupeAdj = (arr: Adj[]) => {
  const seen = new Set<string>();
  return (arr || []).filter((a) => {
    const key = `${a?.name ?? ""}__${a?.size ?? 0}`;
    if (!a?.name) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/* ========= Mapas desde backend ========= */
const backTipo = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
} as const;
const backEstado = {
  ABIERTA: "Abierta",
  EN_TRAMITE: "En trámite",
  RE_ABIERTO: "Re Abierto",
  CERRADA: "Cerrada",
  "EN TRAMITE": "En trámite",
  "EN TRÁMITE": "En trámite",
} as const;
const backOrigen = { BENEFICIARIO: "Beneficiario", TERCERO: "Tercero" } as const;
const backCanal = { WEB: "Web", TELEFONO: "Teléfono", PRESENCIAL: "Presencial", EMAIL: "Email" } as const;

function fromDb(r: any): PQRS {
  const rawEstado: string = (r?.estado ?? r?.status ?? "ABIERTA") as string;
  const uiEstado: Estado =
    (backEstado as any)[rawEstado] ??
    (rawEstado.replace(/\s+/g, "_").toUpperCase() === "RE_ABIERTO"
      ? "Re Abierto"
      : rawEstado === "ABIERTA"
      ? "Abierta"
      : rawEstado === "EN_TRAMITE"
      ? "En trámite"
      : rawEstado === "CERRADA"
      ? "Cerrada"
      : "Abierta");

  return {
    id: typeof r.id === "number" ? r.id : Number(r.id),
    radicado: r.radicado ?? "",
    fecha: (r.fecha ?? "").slice(0, 10),
    tipo: backTipo[r.tipo as keyof typeof backTipo],
    estado: uiEstado,
    origen: backOrigen[r.origen as keyof typeof backOrigen],
    canal: backCanal[r.canal as keyof typeof backCanal],
    solicitante: r.solicitante ?? { tipoDoc: "CC", doc: "", nombres: "", apellidos: "" },
    asunto: r.asunto ?? "",
    descripcion: r.descripcion ?? "",
    responsable: r.responsable ?? undefined,
    vencimiento: r.vencimiento ? r.vencimiento.slice(0, 10) : undefined,
    adjuntos: Array.isArray(r.adjuntos) ? r.adjuntos : [],
    historial: Array.isArray(r.historial) ? r.historial : [],
    beneficiarioId:
      typeof r.beneficiarioId === "number"
        ? r.beneficiarioId
        : r.beneficiarioId
        ? Number(r.beneficiarioId)
        : null,
  };
}

/* ========= Llamadas API ========= */
async function load(setRows: (x: PQRS[]) => void) {
  const res = await fetch("/api/pqrs?page=1&pageSize=200", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  setRows((data.items || []).map(fromDb));
}

function normalizeForApi(p: PQRS) {
  const nombre = fullName(p.solicitante);
  return {
    ...p,
    solicitante: { ...p.solicitante, nombre },
    responsable: p.responsable ?? null,
    vencimiento: p.vencimiento ?? null,
    beneficiarioId: typeof p.beneficiarioId === "number" ? p.beneficiarioId : null,
    adjuntos: dedupeAdj(p.adjuntos || []),
  };
}

async function apiCreate(p: PQRS) {
  const payload = normalizeForApi(p);
  const { id, ...rest } = payload as any;

  const resp = await fetch("/api/pqrs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rest),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

async function apiUpdate(p: PQRS) {
  if (!p.id) throw new Error("ID requerido para actualizar");
  const payload = normalizeForApi(p);

  const resp = await fetch(`/api/pqrs/${p.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

/* ========= Página ========= */
export default function PQRSPage() {
  const title = "PQRS";
  const reduceMotion = useReducedMotion();

  const [rows, setRows] = useState<PQRS[]>([]);
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState<"" | Estado>("");
  const [fTipo, setFTipo] = useState<"" | Tipo>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PQRS | null>(null);

  const [closeOpen, setCloseOpen] = useState(false);
  const [selectedPqrs, setSelectedPqrs] = useState<{ id: number; radicado?: string; estado?: Estado } | null>(null);

  useEffect(() => {
    load(setRows).catch(() => toast.error("No se pudo cargar la lista"));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const byQ =
        !t ||
        [r.radicado, r.asunto, fullName(r.solicitante) || "", r.solicitante?.doc || "", r.responsable || ""]
          .join(" ")
          .toLowerCase()
          .includes(t);
      const byE = !fEstado || r.estado === fEstado;
      const byT = !fTipo || r.tipo === fTipo;
      return byQ && byE && byT;
    });
  }, [rows, q, fEstado, fTipo]);

  const startCreate = () => {
    const draft: PQRS = {
      id: undefined,
      radicado: "",
      fecha: today(),
      tipo: "Petición",
      estado: "Abierta",
      origen: "Beneficiario",
      canal: "Web",
      solicitante: { tipoDoc: "CC", doc: "", nombres: "", apellidos: "", telefono: "", email: "" },
      asunto: "",
      descripcion: "",
      responsable: "Mesa de ayuda",
      vencimiento: addDays(today(), 15),
      adjuntos: [],
      historial: [{ fecha: today(), evento: "Radicado" }],
      beneficiarioId: null,
    };
    setEditing(draft);
    setOpen(true);
  };

  const startEdit = (row: PQRS) => {
    if (row.estado === "Cerrada") {
      toast("PQRS cerrada: no se puede editar.");
      return;
    }
    setEditing(JSON.parse(JSON.stringify(row)));
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;

    if (editing.estado === "Cerrada") {
      toast("PQRS cerrada: no se puede guardar cambios.");
      return;
    }

    if (!editing.asunto?.trim()) return toast.error("El asunto es obligatorio");
    if (!editing.descripcion?.trim()) return toast.error("La descripción es obligatoria");
    if (!editing.solicitante?.doc?.trim()) return toast.error("El documento del solicitante es obligatorio");

    if (editing.origen === "Beneficiario") {
      if (!editing.solicitante?.nombres?.trim()) return toast.error("Los nombres son obligatorios");
      if (!editing.solicitante?.apellidos?.trim()) return toast.error("Los apellidos son obligatorios");
    } else {
      if (!fullName(editing.solicitante)?.trim()) return toast.error("El nombre del solicitante es obligatorio");
    }

    const isNew = !editing.id;

    try {
      await toast.promise(isNew ? apiCreate(editing) : apiUpdate(editing), {
        loading: isNew ? "Creando..." : "Actualizando...",
        success: isNew ? "PQRS creado" : "PQRS actualizado",
        error: (e) => e?.message || "Error al guardar",
      });
      await load(setRows);
      setOpen(false);
    } catch {}
  };

  const abrirSeguimiento = (row: PQRS) => {
    if (!row.id) return;
    setSelectedPqrs({ id: row.id, radicado: row.radicado, estado: row.estado });
    setCloseOpen(true);
  };

  const tone = (e: Estado) => estadoTone(e);

  return (
    <DashboardShell title={title}>
      <motion.div
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar radicado, asunto, solicitante..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-64 pl-8"
              />
            </div>

            <Select value={fEstado} onChange={(e) => setFEstado(e.target.value as Estado | "")}>
              <option value="">Estado: Todos</option>
              {(["Abierta", "En trámite", "Re Abierto", "Cerrada"] as Estado[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <Select value={fTipo} onChange={(e) => setFTipo(e.target.value as Tipo | "")}>
              <option value="">Tipo: Todos</option>
              {(["Petición", "Queja", "Reclamo", "Sugerencia"] as Tipo[]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Button onClick={startCreate}>
              <Plus size={16} /> Nuevo PQRS
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--subtle)] text-slate-500">
              <tr>
                <th className="py-2 pl-4 pr-3 text-left">Radicado</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Solicitante</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Responsable</th>
                <th className="px-3 py-2 text-left">SLA</th>
                <th className="w-56 px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((r) => {
                  const isClosed = r.estado === "Cerrada";

                  const toneSLA =
                    r.estado === "Cerrada"
                      ? "slate"
                      : r.vencimiento && new Date(r.vencimiento) < new Date()
                      ? "rose"
                      : "emerald";

                  const nombre = fullName(r.solicitante) || "—";

                  return (
                    <motion.tr
                      key={r.id ?? r.radicado}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
                      className="border-b border-[var(--subtle)]/70"
                    >
                      <td className="py-2 pl-4 pr-3 font-medium">{r.radicado}</td>
                      <td className="px-3 py-2">{r.fecha}</td>
                      <td className="px-3 py-2">{r.tipo}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span>{nombre}</span>
                          {r.solicitante?.doc && (
                            <Badge tone="slate">
                              {r.solicitante?.tipoDoc ? r.solicitante.tipoDoc + " " : ""}
                              {r.solicitante.doc}
                            </Badge>
                          )}
                          {typeof r.beneficiarioId === "number" && r.beneficiarioId > 0 && (
                            <Badge tone="emerald">Beneficiario vinculado</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={tone(r.estado)}>{r.estado}</Badge>
                      </td>
                      <td className="px-3 py-2">{r.responsable || "—"}</td>
                      <td className="px-3 py-2">
                        {r.vencimiento ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} className="text-slate-400" />
                            <Badge tone={toneSLA}>{r.vencimiento}</Badge>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => startEdit(r)}
                            disabled={isClosed}
                            title={isClosed ? "PQRS cerrada: no se puede editar" : "Detalle"}
                          >
                            <Pencil size={14} /> Detalle
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => abrirSeguimiento(r)}
                            className="h-8 px-3 rounded-md shadow-sm border-slate-200 hover:bg-white"
                            title="Abrir seguimiento"
                          >
                            <MessageSquare size={14} /> Seguimiento
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {filtered.length === 0 && (
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Sin resultados.
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      <PQRSModal open={open} setOpen={setOpen} editing={editing} setEditing={setEditing} onSave={save} />

      <ClosePqrsModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        pqrsId={selectedPqrs?.id ?? null}
        radicado={selectedPqrs?.radicado}
        mode="seguimiento"
        locked={selectedPqrs?.estado === "Cerrada"}
        onUpdated={async () => {
          await load(setRows);
          toast.success("Seguimiento guardado");
        }}
        onClosed={async () => {
          await load(setRows);
          setCloseOpen(false);
          toast.success("PQRS cerrada correctamente");
        }}
      />
    </DashboardShell>
  );
}

/* ========= Modal ========= */
function PQRSModal({
  open,
  setOpen,
  editing,
  setEditing,
  onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  editing: PQRS | null;
  setEditing: React.Dispatch<React.SetStateAction<PQRS | null>>;
  onSave: () => void;
}) {
  const [benefLoading, setBenefLoading] = useState(false);
  const [benefLast, setBenefLast] = useState<"idle" | "found" | "notfound" | "created">("idle");

  const [adjSaved, setAdjSaved] = useState<Adj[]>([]);
  const [adjNew, setAdjNew] = useState<File[]>([]);

  useEffect(() => {
    if (!editing) return;
    setAdjSaved(Array.isArray(editing.adjuntos) ? editing.adjuntos : []);
    setAdjNew([]);
    setBenefLast("idle");
  }, [editing?.id, open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editing) return;

    const saved = (adjSaved || [])
      .map((a) => ({
        name: String(a?.name ?? "").trim(),
        size: typeof a?.size === "number" ? a.size : undefined,
        url: a?.url,
        mime: a?.mime,
      }))
      .filter((a) => a.name);

    const news: Adj[] = (adjNew || []).map((f) => ({
      name: f.name,
      size: f.size,
      mime: f.type || undefined,
    }));

    const merged = dedupeAdj([...saved, ...news]);

    setEditing((prev) => (prev ? { ...prev, adjuntos: merged } : prev));
  }, [adjSaved, adjNew]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editing) return null;

  const isClosed = editing.estado === "Cerrada";

  const rmSaved = (name: string) => setAdjSaved((prev) => prev.filter((a) => a.name !== name));

  const addHist = () =>
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            historial: [...prev.historial, { fecha: today(), evento: "Nota agregada" }],
          }
        : prev
    );

  const buscarBeneficiario = async () => {
    if (isClosed) return toast("PQRS cerrada: no se permite modificar.");

    const tipo = editing.solicitante?.tipoDoc || "CC";
    const doc = (editing.solicitante?.doc || "").trim();

    if (!tipo || !doc) return toast.error("Ingrese tipo y documento para buscar beneficiario.");

    try {
      setBenefLoading(true);
      const res = await fetch(
        `/api/beneficiarios/buscar?tipo=${encodeURIComponent(tipo)}&doc=${encodeURIComponent(doc)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Error buscando beneficiario.");
      }

      const data = await res.json();

      if (!data) {
        setBenefLast("notfound");
        setEditing((prev) => (prev ? { ...prev, beneficiarioId: null } : prev));
        return toast("No existe. Puedes crearlo con el botón 'Crear beneficiario'.");
      }

      const benefId = typeof data.id === "number" ? data.id : Number(data.id);
      setBenefLast("found");

      setEditing((prev) =>
        prev
          ? {
              ...prev,
              beneficiarioId: Number.isFinite(benefId) ? benefId : null,
              solicitante: {
                ...prev.solicitante,
                tipoDoc: (data.tipo_doc ?? prev.solicitante?.tipoDoc ?? "CC") as TipoDoc,
                doc: data.num_doc ?? prev.solicitante?.doc ?? "",
                nombres: data.nombres ?? prev.solicitante?.nombres ?? "",
                apellidos: data.apellidos ?? prev.solicitante?.apellidos ?? "",
                telefono: data.telefono ?? prev.solicitante?.telefono ?? "",
                email: data.email ?? prev.solicitante?.email ?? "",
              },
            }
          : prev
      );

      toast.success("Beneficiario encontrado y vinculado ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Error buscando beneficiario");
    } finally {
      setBenefLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`${editing.id ? "Detalle" : "Nuevo"} PQRS — ${editing.radicado || "sin radicado"}`}
      size="xl"
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)} type="button">
            Cancelar
          </Button>
          <Button onClick={onSave} type="button" disabled={isClosed} title={isClosed ? "PQRS cerrada: no se puede guardar" : "Guardar"}>
            Guardar
          </Button>
        </>
      }
    >
      {isClosed && (
        <div className="px-3 py-2 mb-4 text-sm border rounded-md border-slate-200 bg-slate-50 text-slate-700">
          Este PQRS está <b>cerrado</b>. No se permite editar ni agregar seguimiento.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4 2xl:grid-cols-5">
        <div className="grid gap-4 lg:col-span-3 2xl:col-span-3">
          <Section icon={<FileText size={18} />} title="Datos">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Tipo">
                <Select
                  value={editing.tipo}
                  disabled={isClosed}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, tipo: e.target.value as Tipo } : prev))}
                >
                  {(["Petición", "Queja", "Reclamo", "Sugerencia"] as Tipo[]).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Estado">
                <Select
                  value={editing.estado}
                  disabled={isClosed}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, estado: e.target.value as Estado } : prev))}
                >
                  {(["Abierta", "En trámite", "Re Abierto", "Cerrada"] as Estado[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Canal">
                <Select
                  value={editing.canal}
                  disabled={isClosed}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, canal: e.target.value as Canal } : prev))}
                >
                  {(["Web", "Teléfono", "Presencial", "Email"] as Canal[]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Origen">
                <Select
                  value={editing.origen}
                  disabled={isClosed}
                  onChange={(e) => {
                    const val = e.target.value as Origen;
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            origen: val,
                            beneficiarioId: val === "Tercero" ? null : prev.beneficiarioId ?? null,
                          }
                        : prev
                    );
                  }}
                >
                  {(["Beneficiario", "Tercero"] as Origen[]).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Responsable">
                <Input
                  value={editing.responsable || ""}
                  disabled={isClosed}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, responsable: e.target.value } : prev))}
                />
              </Field>

              <Field label="Vencimiento (SLA)">
                <Input
                  type="date"
                  value={editing.vencimiento || ""}
                  disabled={isClosed}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, vencimiento: e.target.value } : prev))}
                />
              </Field>

              <div className="md:col-span-3">
                <Field label="Asunto">
                  <Textarea
                    rows={3}
                    value={editing.asunto}
                    disabled={isClosed}
                    onChange={(e) => setEditing((prev) => (prev ? { ...prev, asunto: e.target.value } : prev))}
                  />
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field label="Descripción">
                  <Textarea
                    rows={4}
                    value={editing.descripcion}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, descripcion: e.target.value } : prev))
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section icon={<Paperclip size={18} />} title="Adjuntos (Dropzone)">
            <div className="grid gap-3">
              <DocumentDropzone value={adjNew} onChange={setAdjNew} maxFiles={10} maxSizeMB={10} disabled={isClosed} />

              <div className="text-xs text-slate-500">
                En esta versión se guarda la lista/metadata. Si quieres descarga real, luego lo conectamos a storage.
              </div>

              {adjSaved.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-[var(--subtle)] bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-[var(--subtle)] text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Archivo</th>
                        <th className="px-3 py-2 text-left">Tamaño</th>
                        <th className="px-3 py-2 text-left w-28">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjSaved.map((a, idx) => (
                        <tr
                          key={`${a.name}-${a.size ?? 0}-${idx}`}
                          className="border-b border-[var(--subtle)]/70 last:border-b-0"
                        >
                          <td className="px-3 py-2">{a.name}</td>
                          <td className="px-3 py-2">{a.size ? (a.size / 1024).toFixed(1) + " KB" : "—"}</td>
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => rmSaved(a.name)}
                              disabled={isClosed}
                              title={isClosed ? "PQRS cerrada" : "Quitar adjunto"}
                            >
                              Quitar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="grid gap-4 lg:col-span-1 2xl:col-span-2">
          <Section icon={<Tag size={18} />} title="Solicitante / Beneficiario">
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                {editing.origen === "Beneficiario" ? (
                  editing.beneficiarioId ? (
                    <Badge tone="emerald">Beneficiario vinculado</Badge>
                  ) : (
                    <Badge tone="amber">Sin vincular</Badge>
                  )
                ) : (
                  <Badge tone="slate">Origen: Tercero</Badge>
                )}
              </div>

              <div className="grid items-end grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Tipo de documento">
                  <Select
                    value={editing.solicitante?.tipoDoc || "CC"}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, solicitante: { ...prev.solicitante, tipoDoc: e.target.value as TipoDoc } } : prev
                      )
                    }
                  >
                    {(["CC", "TI", "CE", "RC", "PA", "PEP", "PPT", "NIT", "OTRO"] as TipoDoc[]).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Documento">
                  <Input
                    value={editing.solicitante?.doc || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, solicitante: { ...prev.solicitante, doc: e.target.value } } : prev
                      )
                    }
                    placeholder="Número"
                  />
                </Field>
              </div>

              {editing.origen === "Beneficiario" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={buscarBeneficiario}
                    disabled={benefLoading || isClosed}
                    title={isClosed ? "PQRS cerrada" : "Buscar beneficiario"}
                  >
                    <Search size={14} /> {benefLoading ? "Buscando..." : "Buscar beneficiario"}
                  </Button>

                  {benefLast === "notfound" && <Badge tone="rose">No existe</Badge>}
                  {benefLast === "found" && <Badge tone="emerald">Encontrado</Badge>}
                  {benefLast === "created" && <Badge tone="emerald">Creado</Badge>}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nombres">
                  <Input
                    value={editing.solicitante?.nombres || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev
                          ? { ...prev, solicitante: { ...prev.solicitante, nombres: e.target.value } }
                          : prev
                      )
                    }
                  />
                </Field>
                <Field label="Apellidos">
                  <Input
                    value={editing.solicitante?.apellidos || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev
                          ? { ...prev, solicitante: { ...prev.solicitante, apellidos: e.target.value } }
                          : prev
                      )
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Teléfono">
                  <Input
                    value={editing.solicitante?.telefono || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev
                          ? { ...prev, solicitante: { ...prev.solicitante, telefono: e.target.value } }
                          : prev
                      )
                    }
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={editing.solicitante?.email || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev
                          ? { ...prev, solicitante: { ...prev.solicitante, email: e.target.value } }
                          : prev
                      )
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section icon={<Clock size={18} />} title="Seguimiento (historial)">
            <div className="grid gap-3">
              <ul className="space-y-2">
                {editing.historial.map((h, i) => (
                  <li key={i} className="rounded border border-[var(--subtle)] bg-white p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="font-medium">{h.fecha}</span>
                      <span className="text-slate-600">— {h.evento}</span>
                      {h.nota && <span className="text-slate-500">({h.nota})</span>}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isClosed}
                  title={isClosed ? "PQRS cerrada" : "Añadir nota rápida"}
                  onClick={() => {
                    if (isClosed) return;
                    addHist();
                    toast.success("Nota añadida");
                  }}
                >
                  Añadir nota rápida
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={isClosed}
                  title={isClosed ? "PQRS cerrada" : "Asignar"}
                  onClick={() => {
                    if (isClosed) return;
                    toast("Responsable asignado");
                  }}
                >
                  <Pencil size={14} /> Asignar
                </Button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
}
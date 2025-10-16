"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus,
  Search,
  FileText,
  User,
  Paperclip,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  MessageSquare,
  Tag,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ClosePqrsModal from "@/components/ui/ClosePqrsModal";

/* ========= Tipos (UI) ========= */
type Tipo = "Petición" | "Queja" | "Reclamo" | "Sugerencia";
type Estado = "Abierta" | "En trámite" | "Re Abierto" | "Cerrada";
type Origen = "Beneficiario" | "Tercero";
type Canal = "Web" | "Teléfono" | "Presencial" | "Email";
type TipoDoc = "CC" | "CE" | "TI" | "PAS";

type Adj = { name: string; size?: number; url?: string; mime?: string };
type Evento = { fecha: string; evento: string; nota?: string };

type PQRS = {
  id: string;
  radicado: string;
  fecha: string; // ISO day
  tipo: Tipo;
  estado: Estado;
  origen: Origen;
  canal: Canal;
  solicitante: {
    tipoDoc?: TipoDoc;
    doc?: string;
    nombre?: string;
    telefono?: string;
    email?: string;
  };
  asunto: string;
  descripcion: string;
  responsable?: string;
  vencimiento?: string; // ISO day
  adjuntos: Adj[];
  historial: Evento[];
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
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] hover:bg-white"
      : "hover:bg-white";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
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

/* ========= Modal (más grande + scroll) ========= */
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
  if (!open) return null;

  const widthBySize: Record<ModalSize, string> = {
    md: "w-[min(760px,96vw)]",
    lg: "w-[min(1040px,98vw)]",
    xl: "w-[min(1360px,98vw)]",
    full: "w-[96vw]",
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={[
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          widthBySize[size],
          "max-h-[94vh] rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl",
          "flex flex-col",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-[var(--subtle)] px-6 py-4">
          <h4 className="text-base font-semibold">{title}</h4>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Cerrar">
            <XCircle size={18} />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-6 py-4">
          {actions}
        </div>
      </div>
    </div>
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
  e === "Abierta" ? "sky"
  : e === "En trámite" || e === "Re Abierto" ? "amber"
  : "slate";

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
  // tolerancia a mayúsculas/espacios
  "EN TRAMITE": "En trámite",
  "EN TRÁMITE": "En trámite",
} as const;
const backOrigen = { BENEFICIARIO: "Beneficiario", TERCERO: "Tercero" } as const;
const backCanal = {
  WEB: "Web",
  TELEFONO: "Teléfono",
  PRESENCIAL: "Presencial",
  EMAIL: "Email",
} as const;

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
      : "Abierta"); // fallback seguro

  return {
    id: r.id,
    radicado: r.radicado,
    fecha: (r.fecha ?? "").slice(0, 10),
    tipo: backTipo[r.tipo as keyof typeof backTipo],
    estado: uiEstado,
    origen: backOrigen[r.origen as keyof typeof backOrigen],
    canal: backCanal[r.canal as keyof typeof backCanal],
    solicitante: r.solicitante ?? { tipoDoc: "CC", doc: "", nombre: "" },
    asunto: r.asunto ?? "",
    descripcion: r.descripcion ?? "",
    responsable: r.responsable ?? undefined,
    vencimiento: r.vencimiento ? r.vencimiento.slice(0, 10) : undefined,
    adjuntos: Array.isArray(r.adjuntos) ? r.adjuntos : [],
    historial: Array.isArray(r.historial) ? r.historial : [],
  };
}

/* ========= Llamadas API ========= */
async function load(setRows: (x: PQRS[]) => void) {
  const res = await fetch("/api/pqrs?page=1&pageSize=200", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  setRows((data.items || []).map(fromDb));
}
async function apiCreate(p: PQRS) {
  const resp = await fetch("/api/pqrs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}
async function apiUpdate(p: PQRS) {
  const resp = await fetch(`/api/pqrs/${p.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

/* ========= Página ========= */
export default function PQRSPage() {
  const title = "PQRS";
  const [rows, setRows] = useState<PQRS[]>([]);
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState<"" | Estado>("");
  const [fTipo, setFTipo] = useState<"" | Tipo>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PQRS | null>(null);

  // modal de cierre
  const [closeOpen, setCloseOpen] = useState(false);
  const [selectedPqrs, setSelectedPqrs] = useState<{
    id: string | number;
    radicado?: string;
  } | null>(null);

  useEffect(() => {
    load(setRows).catch(() => toast.error("No se pudo cargar la lista"));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const byQ =
        !t ||
        [r.radicado, r.asunto, r.solicitante?.nombre || "", r.solicitante?.doc || "", r.responsable || ""]
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
      id: "", // lo crea el backend
      radicado: "", // lo genera el backend
      fecha: today(),
      tipo: "Petición",
      estado: "Abierta",
      origen: "Beneficiario",
      canal: "Web",
      solicitante: { tipoDoc: "CC", doc: "", nombre: "", telefono: "", email: "" },
      asunto: "",
      descripcion: "",
      responsable: "Mesa de ayuda",
      vencimiento: addDays(today(), 15),
      adjuntos: [],
      historial: [{ fecha: today(), evento: "Radicado" }],
    };
    setEditing(draft);
    setOpen(true);
  };

  const startEdit = (row: PQRS) => {
    setEditing(JSON.parse(JSON.stringify(row)));
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    // Validaciones suaves con toast
    if (!editing.asunto?.trim()) return toast.error("El asunto es obligatorio");
    if (!editing.descripcion?.trim())
      return toast.error("La descripción es obligatoria");
    if (!editing.solicitante?.nombre?.trim())
      return toast.error("El nombre del solicitante es obligatorio");

    const isNew = !editing.id;

    try {
      await toast.promise(isNew ? apiCreate(editing) : apiUpdate(editing), {
        loading: isNew ? "Creando..." : "Actualizando...",
        success: isNew ? "PQRS creado" : "PQRS actualizado",
        error: (e) => e?.message || "Error al guardar",
      });
      await load(setRows);
      setOpen(false);
    } catch {
      /* toast.promise ya mostró el error */
    }
  };

  const abrirSeguimiento = (row: PQRS) => {
    setSelectedPqrs({ id: row.id, radicado: row.radicado });
    setCloseOpen(true);
  };

  const cambiarEstado = async (row: PQRS, estado: Estado) => {
    try {
      await toast.promise(
        fetch(`/api/pqrs/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }),
        }),
        {
          loading: "Actualizando estado...",
          success: "Estado actualizado",
          error: "No se pudo actualizar el estado",
        }
      );
      await load(setRows);
    } catch {
      /* toast ya mostró error */
    }
  };

  const tone = (e: Estado) => estadoTone(e);

  return (
    <DashboardShell title={title}>
      <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
        {/* Barra superior */}
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

        {/* Tabla */}
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
              {filtered.map((r) => {
                const toneSLA =
                  r.estado === "Cerrada"
                    ? "slate"
                    : r.vencimiento && new Date(r.vencimiento) < new Date()
                    ? "rose"
                    : "emerald";
                return (
                  <tr key={r.id} className="border-b border-[var(--subtle)]/70">
                    <td className="py-2 pl-4 pr-3 font-medium">{r.radicado}</td>
                    <td className="px-3 py-2">{r.fecha}</td>
                    <td className="px-3 py-2">{r.tipo}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span>{r.solicitante?.nombre || "—"}</span>
                        {r.solicitante?.doc && (
                          <Badge tone="slate">
                            {r.solicitante?.tipoDoc ? r.solicitante.tipoDoc + " " : ""}
                            {r.solicitante.doc}
                          </Badge>
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
                        <Button variant="outline" onClick={() => startEdit(r)}>
                          <Pencil size={14} /> Detalle
                        </Button>

                        <Button variant="ghost" onClick={() => abrirSeguimiento(r)}>
                          <MessageSquare size={14} /> Seguimiento
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      <PQRSModal
        open={open}
        setOpen={setOpen}
        editing={editing}
        setEditing={setEditing}
        onSave={save}
      />

      {/* Modal de cierre / seguimiento */}
      <ClosePqrsModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        pqrsId={selectedPqrs?.id ?? null}
        radicado={selectedPqrs?.radicado}
        mode="seguimiento"                // << NUEVO: el modal se renderiza en modo Seguimiento
        onUpdated={async () => {          // << opcional: cuando agregas nota / reasignas / cambias algo
          await load(setRows);
          toast.success("Seguimiento guardado");
        }}
        onClosed={async () => {           // << cuando desde el modal deciden Cerrar la PQR
          await load(setRows);
          setCloseOpen(false);
          toast.success("PQRS cerrada correctamente");
        }}
      />
    </DashboardShell>
  );
}

/* ========= Modal de detalle / creación ========= */
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
  setEditing: (p: PQRS | null) => void;
  onSave: () => void;
}) {
  if (!editing) return null;

  const onAdj = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
    setEditing({ ...editing, adjuntos: [...editing.adjuntos, ...arr] });
  };
  const rmAdj = (name: string) =>
    setEditing({
      ...editing,
      adjuntos: editing.adjuntos.filter((a) => a.name !== name),
    });

  const addHist = () =>
    setEditing({
      ...editing,
      historial: [
        ...editing.historial,
        { fecha: new Date().toISOString().slice(0, 10), evento: "Nota agregada" },
      ],
    });

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`${editing.id ? "Detalle" : "Nuevo"} PQRS — ${editing.radicado || "sin radicado"}`}
      size="xl"
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>Guardar</Button>
        </>
      }
    >
      {/* MÁS columnas y más espacio a la derecha */}
      <div className="grid gap-6 lg:grid-cols-4 2xl:grid-cols-5">
        {/* Datos principales (izquierda) */}
        <div className="grid gap-4 lg:col-span-3 2xl:col-span-3">
          <Section icon={<FileText size={18} />} title="Datos">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Tipo">
                <Select
                  value={editing.tipo}
                  onChange={(e) => setEditing({ ...editing, tipo: e.target.value as Tipo })}
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
                  onChange={(e) => setEditing({ ...editing, estado: e.target.value as Estado })}
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
                  onChange={(e) => setEditing({ ...editing, canal: e.target.value as Canal })}
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
                  onChange={(e) => setEditing({ ...editing, origen: e.target.value as Origen })}
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
                  onChange={(e) => setEditing({ ...editing, responsable: e.target.value })}
                  placeholder="Área/Usuario"
                />
              </Field>
              <Field label="Vencimiento (SLA)">
                <Input
                  type="date"
                  value={editing.vencimiento || ""}
                  onChange={(e) => setEditing({ ...editing, vencimiento: e.target.value })}
                />
              </Field>

              {/* Asunto más amplio */}
              <div className="md:col-span-3">
                <Field label="Asunto">
                  <Textarea
                    rows={3}
                    value={editing.asunto}
                    onChange={(e) => setEditing({ ...editing, asunto: e.target.value })}
                    placeholder="Resumen breve"
                  />
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field label="Descripción">
                  <Textarea
                    rows={4}
                    value={editing.descripcion}
                    onChange={(e) =>
                      setEditing({ ...editing, descripcion: e.target.value })
                    }
                    placeholder="Detalle del caso"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section icon={<Paperclip size={18} />} title="Adjuntos (PDF/otros)">
            <div className="grid gap-3">
              <input type="file" multiple onChange={(e) => onAdj(e.target.files)} />
              {editing.adjuntos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-[var(--subtle)] text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Archivo</th>
                        <th className="px-3 py-2 text-left">Tamaño</th>
                        <th className="px-3 py-2 text-left w-28">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editing.adjuntos.map((a) => (
                        <tr key={a.name} className="border-b border-[var(--subtle)]/70">
                          <td className="px-3 py-2">{a.name}</td>
                          <td className="px-3 py-2">
                            {a.size ? (a.size / 1024).toFixed(1) + " KB" : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <Button variant="ghost" onClick={() => rmAdj(a.name)}>
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

        {/* Lado derecho: más ancho */}
        <div className="grid gap-4 lg:col-span-1 2xl:col-span-2">
          <Section icon={<Tag size={18} />} title="Solicitante">
            <div className="grid grid-cols-1 gap-4">
              {/* Fila Tipo de doc + Documento alineada */}
              <div className="grid items-end grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={
                    <span className="block h-5 leading-5 whitespace-nowrap">
                      Tipo de documento
                    </span>
                  }
                >
                  <Select
                    value={editing.solicitante?.tipoDoc || "CC"}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        solicitante: {
                          ...editing.solicitante,
                          tipoDoc: e.target.value as TipoDoc,
                        },
                      })
                    }
                    className="w-full"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="TI">TI</option>
                    <option value="PAS">PAS</option>
                  </Select>
                </Field>

                <Field label={<span className="block h-5 leading-5">Documento</span>}>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9A-Za-z.-]{4,}"
                    placeholder="Número"
                    value={editing.solicitante?.doc || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        solicitante: { ...editing.solicitante, doc: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Nombre">
                <Input
                  value={editing.solicitante?.nombre || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      solicitante: { ...editing.solicitante, nombre: e.target.value },
                    })
                  }
                  placeholder="Nombre completo"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Teléfono">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={editing.solicitante?.telefono || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        solicitante: { ...editing.solicitante, telefono: e.target.value },
                      })
                    }
                    placeholder="300 000 0000"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    autoComplete="email"
                    value={editing.solicitante?.email || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        solicitante: { ...editing.solicitante, email: e.target.value },
                      })
                    }
                    placeholder="correo@dominio.com"
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="font-medium">{h.fecha}</span>
                        <span className="text-slate-600">— {h.evento}</span>
                      </div>
                      {h.nota && <span className="text-slate-500">{h.nota}</span>}
                    </div>
                  </li>
                ))}
                {editing.historial.length === 0 && (
                  <li className="text-sm text-slate-500">Sin eventos.</li>
                )}
              </ul>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    addHist();
                    toast.success("Nota añadida");
                  }}
                >
                  Añadir nota rápida
                </Button>
                <Button variant="ghost" onClick={() => toast("Responsable asignado")}>
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

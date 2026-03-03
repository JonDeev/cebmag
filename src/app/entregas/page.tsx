"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Package,
  Plus,
  Search,
  Truck,
  ClipboardCheck,
  Printer,
  Upload,
  Trash2,
  Pencil,
  CheckCircle2,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  getEntregas,
  createEntrega,
  updateEntrega,
  type Entrega,
  type Estado,
  type Item,
  type TipoDoc,
} from "@/lib/entregas.api";

import DocumentDropzone from "@/components/files/DocumentDropzone";

/* ============ Helpers UI ============ */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
  const reduceMotion = useReducedMotion();
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] hover:bg-white"
      : "hover:bg-white";

  return (
    <motion.button
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
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
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
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
  tone?: "slate" | "amber" | "emerald";
}) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${map[tone]}`}>
      {children}
    </span>
  );
}

function Section({
  title,
  icon,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
      <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--brand)]">{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ============ Modal animado ============ */
function Modal({
  open,
  onClose,
  title,
  wide,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

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
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
              className={[
                wide ? "w-[min(1100px,96vw)]" : "w-[min(720px,92vw)]",
                "max-h-[92vh] overflow-hidden",
                "rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-2xl",
                "flex flex-col",
              ].join(" ")}
            >
              <div className="flex items-center justify-between border-b border-[var(--subtle)] px-5 py-4">
                <h4 className="text-sm font-semibold">{title}</h4>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-slate-100"
                  aria-label="Cerrar"
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 min-h-0 p-5 overflow-y-auto">{children}</div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-5 py-4">
                {actions}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ============ Sesión (usuario logueado) ============ */
type SessionUser = { id: number; nombre: string; email?: string | null };

async function readJsonOrText(res: Response) {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw || null;
  }
}

function pickUserFromAny(obj: any): SessionUser | null {
  const u = obj?.user ?? obj?.data?.user ?? obj;
  const id = Number(u?.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const nombre = String(u?.nombre ?? u?.name ?? "").trim();
  return { id, nombre: nombre || "Usuario", email: u?.email ?? null };
}

function loadUserFromStorage(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const keys = ["auth_user", "user", "session_user", "cebmag_user"];
  for (const k of keys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      const u = pickUserFromAny(obj);
      if (u) return u;
    } catch {}
  }
  return null;
}

async function loadSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`/api/auth/me?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await readJsonOrText(res);
      const u = pickUserFromAny(data);
      if (u) return u;
    }
  } catch {}
  return loadUserFromStorage();
}

/* ============ Utilidades ============ */
const today = () => new Date().toISOString().slice(0, 10);

type KitApiItem = {
  id: number;
  nombre: string;
  unidad?: string | null;
  cantidad: number;
  opcional: boolean;
  orden: number;
};

type KitApi = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  items: KitApiItem[];
};

type EntregaDraft = Entrega & {
  responsableUserId?: number | null;
  kitId?: number | null;
};

function emptyDraft(): EntregaDraft {
  return {
    id: 0,
    comprobante: "",
    fecha: today(),
    beneficiario: { tipo_doc: "CC", doc: "", nombre: "" },
    direccion: "",
    responsable: "",
    responsableUserId: null,
    estado: "Pendiente",
    kitId: null,
    kit: "",
    items: [],
    observaciones: "",
    adjuntos: [],
  };
}

const esc = (v: any) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const fmtFecha = (iso: string) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const renderComprobanteHtml = (r: Entrega) => {
  const itemsRows = (r.items || [])
    .map(
      (it, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(it.nombre)}</td>
        <td>${esc(it.unidad)}</td>
        <td style="text-align:right;">${esc(it.cantidad)}</td>
      </tr>`
    )
    .join("");

  const beneficiarioDoc = `${r.beneficiario?.tipo_doc ? esc(r.beneficiario.tipo_doc) + " " : ""}${esc(
    r.beneficiario?.doc
  )}`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Comprobante ${esc(r.comprobante || "")}</title>
  <style>
    :root{ --b:#e5e7eb; --t:#0f172a; --m:#475569; }
    *{ box-sizing:border-box; }
    body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:var(--t); }
    .page{ padding:24px; }
    .top{ display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
    .brand{
      font-weight:800; letter-spacing:.3px; font-size:14px;
      border:1px solid var(--b); padding:10px 12px; border-radius:10px;
    }
    h1{ margin:0; font-size:16px; }
    .muted{ color:var(--m); font-size:12px; margin-top:4px; }
    .box{ border:1px solid var(--b); border-radius:12px; padding:14px; margin-top:14px; }
    .grid{ display:grid; grid-template-columns: repeat(12, 1fr); gap:10px; }
    .col4{ grid-column: span 4; }
    .col8{ grid-column: span 8; }
    .col12{ grid-column: span 12; }
    .label{ font-size:11px; color:var(--m); }
    .val{ font-size:13px; margin-top:2px; font-weight:600; }
    table{ width:100%; border-collapse:collapse; margin-top:10px; }
    th, td{ border-bottom:1px solid var(--b); padding:8px 8px; font-size:12px; }
    th{ text-align:left; color:var(--m); font-weight:700; }
    .sign{ display:grid; grid-template-columns: 1fr 1fr; gap:18px; margin-top:18px; }
    .line{ border-top:1px solid var(--b); padding-top:8px; font-size:12px; color:var(--m); }
    .obs{ white-space:pre-wrap; font-size:12px; }
    @media print{
      .page{ padding:0; }
      .box{ break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div>
        <h1>COMPROBANTE DE ENTREGA DE INSUMOS / KITS</h1>
        <div class="muted">Documento interno • Generado desde CEBMAG</div>
      </div>
      <div class="brand">
        CEBMAG<br/>
        <span class="muted">Comprobante: <b>${esc(r.comprobante || "—")}</b></span>
      </div>
    </div>

    <div class="box">
      <div class="grid">
        <div class="col4">
          <div class="label">Fecha</div>
          <div class="val">${esc(fmtFecha(r.fecha))}</div>
        </div>
        <div class="col4">
          <div class="label">Estado</div>
          <div class="val">${esc(r.estado)}</div>
        </div>
        <div class="col4">
          <div class="label">Responsable</div>
          <div class="val">${esc(r.responsable)}</div>
        </div>

        <div class="col8">
          <div class="label">Beneficiario</div>
          <div class="val">${esc(r.beneficiario?.nombre || "")}</div>
        </div>
        <div class="col4">
          <div class="label">Documento</div>
          <div class="val">${beneficiarioDoc}</div>
        </div>

        <div class="col12">
          <div class="label">Dirección (si aplica)</div>
          <div class="val">${esc(r.direccion || "—")}</div>
        </div>

        <div class="col12">
          <div class="label">Kit / Plantilla</div>
          <div class="val">${esc(r.kit || "—")}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:48px;">#</th>
            <th>Producto</th>
            <th style="width:90px;">Unidad</th>
            <th style="width:90px; text-align:right;">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || `<tr><td colspan="4" class="muted">Sin ítems.</td></tr>`}
        </tbody>
      </table>

      <div style="margin-top:12px;">
        <div class="label">Observaciones</div>
        <div class="obs">${esc(r.observaciones || "—")}</div>
      </div>

      <div class="sign">
        <div class="line">Firma responsable</div>
        <div class="line">Firma recibe (beneficiario)</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

function toEntregaItemsFromKit(kit: KitApi): Item[] {
  const sorted = [...(kit.items || [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return sorted.map((it) => ({
    nombre: String(it.nombre ?? "").trim(),
    unidad: String(it.unidad ?? "UND").trim() || "UND",
    cantidad: Number(it.cantidad ?? 1),
  })) as any;
}

type AdjMeta = { name: string; size: number };

/* ============ Página ============ */
export default function EntregasPage() {
  const title = "Entregas de insumos/kits";
  const reduceMotion = useReducedMotion();

  const [rows, setRows] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);

  const [me, setMe] = useState<SessionUser | null>(null);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | Estado>("");
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EntregaDraft | null>(null);

  const [kits, setKits] = useState<KitApi[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);

  const loadKits = async () => {
    setKitsLoading(true);
    try {
      const res = await fetch(`/api/kits?onlyActive=true&ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
      });
      if (!res.ok) throw new Error("No se pudo cargar kits");
      const data = (await res.json()) as KitApi[];
      setKits(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar kits");
      setKits([]);
    } finally {
      setKitsLoading(false);
    }
  };

  const reload = async () => {
    setLoading(true);
    try {
      const res = await getEntregas({ q, estado, from: r1, to: r2, page: 1, pageSize: 200 });
      setRows(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const u = await loadSessionUser();
      setMe(u);
    })();

    loadKits().catch(() => {});
    reload().catch(() => toast.error("No se pudo cargar entregas"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      reload().catch(() => {});
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estado, r1, r2]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const hitQ =
        !q ||
        [r.comprobante, r.beneficiario?.nombre, r.beneficiario?.doc, r.responsable, r.kit || "", r.observaciones || ""]
          .join(" ")
          .toLowerCase()
          .includes(q.trim().toLowerCase());
      const hitE = !estado || r.estado === estado;
      const hitR1 = !r1 || r.fecha >= r1;
      const hitR2 = !r2 || r.fecha <= r2;
      return hitQ && hitE && hitR1 && hitR2;
    });
  }, [rows, q, estado, r1, r2]);

  const totals = useMemo(() => {
    const t = rows.length;
    const p = rows.filter((x) => x.estado === "Pendiente").length;
    const parc = rows.filter((x) => x.estado === "Parcial").length;
    const e = rows.filter((x) => x.estado === "Entregado").length;
    return { t, p, parc, e };
  }, [rows]);

  const nueva = () => {
    const d = emptyDraft();
    if (me) {
      d.responsable = me.nombre;
      d.responsableUserId = me.id;
    } else {
      toast.error("No pude leer el usuario de sesión. Re-inicia sesión.");
    }
    setDraft(d);
    setOpen(true);
  };

  const editar = (e: Entrega) => {
    const copy = JSON.parse(JSON.stringify(e)) as EntregaDraft;
    if (copy.kitId === undefined) copy.kitId = null;
    if (copy.responsableUserId === undefined) copy.responsableUserId = null;
    setDraft(copy);
    setOpen(true);
  };

  const guardar = async () => {
    if (!draft) return;

    if (!draft.beneficiario?.doc?.trim()) return toast.error("Documento del beneficiario es obligatorio");
    if (!draft.beneficiario?.nombre?.trim()) return toast.error("Nombre del beneficiario es obligatorio");
    if (!draft.items?.length) return toast.error("Debes agregar al menos 1 ítem");

    const isNew = !(draft.id && draft.id > 0);
    if (isNew && (!me || !me.id)) {
      return toast.error("No hay sesión activa para asignar responsable. Inicia sesión de nuevo.");
    }

    const payload: any = {
      comprobante: draft.comprobante || undefined,
      fecha: draft.fecha,
      estado: draft.estado,
      kitId: draft.kitId ?? null,
      kit: draft.kit || undefined,
      beneficiario: draft.beneficiario,
      direccion: draft.direccion || undefined,
      items: (draft.items || []).map((it: any) => ({
        nombre: it.nombre,
        unidad: it.unidad,
        cantidad: it.cantidad,
      })),
      observaciones: draft.observaciones || undefined,
      adjuntos: draft.adjuntos ?? [],
    };

    if (isNew && me) {
      payload.responsable = me.nombre;
      payload.responsableUserId = me.id;
    }

    const saved = isNew ? await createEntrega(payload) : await updateEntrega(draft.id!, payload);
    if (!saved) return;

    setDraft(saved as any);
    setOpen(false);
    await reload();

    if (saved.estado === "Entregado" && (saved.items?.length ?? 0) > 0) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              Guardado ✅ <span className="text-slate-500">¿Deseas imprimir el comprobante?</span>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                imprimir(saved);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white hover:opacity-90"
              type="button"
            >
              <Printer size={14} /> Imprimir
            </button>
          </div>
        ),
        { duration: 6000 }
      );
    } else {
      toast.success("Guardado ✅");
    }
  };

  const cambiarEstado = async (row: Entrega, est: Estado) => {
    const saved = await updateEntrega(row.id, { estado: est } as any);
    if (!saved) return;
    setRows((prev) => prev.map((x) => (x.id === row.id ? saved : x)));
  };

  const imprimir = (row: Entrega) => {
    if (!row.items || row.items.length === 0) return toast.error("No puedes imprimir: la entrega no tiene ítems.");
    if (row.estado !== "Entregado") return toast.error('Solo puedes imprimir cuando el estado sea "Entregado".');

    try {
      const html = renderComprobanteHtml(row);

      const w = window.open("", "_blank");
      if (!w) return toast.error("El navegador bloqueó la ventana. Permite pop-ups.");

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      w.location.href = url;

      const doPrint = () => {
        try {
          w.focus();
          w.print();
        } catch {}
      };

      w.onload = () => {
        setTimeout(doPrint, 200);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      };

      setTimeout(() => {
        try {
          if (w.document?.readyState === "complete") return;
          w.document.open();
          w.document.write(html);
          w.document.close();
          setTimeout(doPrint, 200);
        } catch {}
      }, 800);

      w.onafterprint = () => {
        try {
          w.close();
        } catch {}
      };
    } catch (err) {
      console.error("Error imprimiendo comprobante:", err);
      toast.error("Error generando comprobante. Revisa la consola (F12).");
    }
  };

  const exportCSV = () => {
    const head = ["comprobante", "fecha", "doc", "beneficiario", "responsable", "estado", "kit", "items", "obs"];
    const lines = filtered.map((r) =>
      [
        r.comprobante,
        r.fecha,
        r.beneficiario.doc,
        r.beneficiario.nombre,
        r.responsable,
        r.estado,
        r.kit || "",
        r.items.map((i) => `${i.nombre} x ${i.cantidad}${i.unidad}`).join(" | "),
        (r.observaciones || "").replace(/\n/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [head.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `entregas_${today()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <DashboardShell title={title}>
      <motion.div
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="grid gap-6"
      >
        <Section
          title="Registro de entregas"
          icon={<Package size={18} />}
          actions={
            <>
              <div className="items-center hidden gap-2 md:flex">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input className="w-64 pl-8" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <Select value={estado} onChange={(e) => setEstado(e.target.value as Estado | "")}>
                  <option value="">Estado: Todos</option>
                  {(["Pendiente", "Parcial", "Entregado"] as Estado[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Input type="date" value={r1} onChange={(e) => setR1(e.target.value)} />
                <Input type="date" value={r2} onChange={(e) => setR2(e.target.value)} />
              </div>
              <Button variant="outline" onClick={exportCSV}>
                <FileDown size={16} /> Exportar
              </Button>
              <Button onClick={nueva}>
                <Plus size={16} /> Nueva entrega
              </Button>
            </>
          }
        >
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
            {[
              { label: "Total", value: totals.t },
              { label: "Pendientes", value: totals.p },
              { label: "Parciales", value: totals.parc },
              { label: "Entregadas", value: totals.e },
            ].map((k) => (
              <motion.div
                key={k.label}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
                className="rounded border border-[var(--subtle)] bg-white p-3 text-sm"
              >
                <div className="text-slate-500">{k.label}</div>
                <div className="text-xl font-semibold">{k.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                  <th className="py-2 pl-4 pr-3 text-left">Comprobante</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Beneficiario</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Responsable</th>
                  <th className="px-3 py-2 text-left">Ítems</th>
                  <th className="w-64 px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      Cargando…
                    </td>
                  </tr>
                )}

                {!loading && (
                  <AnimatePresence initial={false}>
                    {filtered.map((r) => (
                      <motion.tr
                        key={r.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
                        className="border-b border-[var(--subtle)]/70"
                      >
                        <td className="py-2 pl-4 pr-3 font-medium">{r.comprobante}</td>
                        <td className="px-3 py-2">{r.fecha}</td>
                        <td className="px-3 py-2">
                          {r.beneficiario.nombre} <span className="text-slate-500">({r.beneficiario.doc || "s/d"})</span>
                        </td>
                        <td className="px-3 py-2">
                          {r.estado === "Entregado" ? (
                            <Badge tone="emerald">
                              <CheckCircle2 className="mr-1" size={12} /> Entregado
                            </Badge>
                          ) : r.estado === "Parcial" ? (
                            <Badge tone="amber">Parcial</Badge>
                          ) : (
                            <Badge tone="slate">Pendiente</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">{r.responsable || "—"}</td>
                        <td className="px-3 py-2">{r.items.length}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => editar(r)}>
                              <Pencil size={14} /> Detalle
                            </Button>
                            <Select
                              value={r.estado}
                              onChange={(e) => cambiarEstado(r, e.target.value as Estado)}
                              className="w-32"
                            >
                              {(["Pendiente", "Parcial", "Entregado"] as Estado[]).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                            <Button variant="ghost" onClick={() => imprimir(r)}>
                              <Printer size={14} /> Imprimir
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      Sin resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </motion.div>

      <EntregaModal
        open={open}
        setOpen={setOpen}
        draft={draft}
        setDraft={setDraft}
        onSave={guardar}
        onPrint={imprimir}
        sessionUser={me}
        kits={kits}
        kitsLoading={kitsLoading}
        reloadKits={loadKits}
      />
    </DashboardShell>
  );
}

/* ============ Modal ============ */
function EntregaModal({
  open,
  setOpen,
  draft,
  setDraft,
  onSave,
  onPrint,
  sessionUser,
  kits,
  kitsLoading,
  reloadKits,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: EntregaDraft | null;
  setDraft: React.Dispatch<React.SetStateAction<EntregaDraft | null>>;
  onSave: () => void;
  onPrint: (row: Entrega) => void;
  sessionUser: SessionUser | null;

  kits: KitApi[];
  kitsLoading: boolean;
  reloadKits: () => Promise<void>;
}) {
  const [benefLoading, setBenefLoading] = useState(false);

  // Adjuntos: guardados (metadata) + nuevos (File[])
  const [adjSaved, setAdjSaved] = useState<AdjMeta[]>([]);
  const [adjNew, setAdjNew] = useState<File[]>([]);

  const normalizeAdjSaved = (arr: any): AdjMeta[] => {
    const a = Array.isArray(arr) ? arr : [];
    return a
      .map((x: any) => ({
        name: String(x?.name ?? x?.nombre ?? "").trim(),
        size: Number(x?.size ?? 0),
      }))
      .filter((x: AdjMeta) => x.name);
  };

  const dedupeMeta = (arr: AdjMeta[]) => {
    const seen = new Set<string>();
    return (arr || []).filter((x) => {
      const k = `${x.name}__${x.size}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  // reset cuando abres/cambias entrega
  useEffect(() => {
    if (!open || !draft) return;
    setAdjSaved(normalizeAdjSaved(draft.adjuntos));
    setAdjNew([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft?.id]);

  // sincroniza draft.adjuntos (metadata) = adjSaved + adjNew
  useEffect(() => {
    if (!draft) return;
    const merged: AdjMeta[] = dedupeMeta([
      ...adjSaved,
      ...adjNew.map((f) => ({ name: f.name, size: f.size })),
    ]);

    setDraft((prev) => (prev ? { ...prev, adjuntos: merged as any } : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjSaved, adjNew]);

  // Autovincular kitId por nombre si abre una entrega vieja
  useEffect(() => {
    if (!draft) return;
    if (draft.kitId) return;
    if (!draft.kit?.trim()) return;
    if (!kits.length) return;

    const hit = kits.find((k) => k.nombre.trim().toLowerCase() === draft.kit!.trim().toLowerCase());
    if (hit) {
      setDraft((prev) => {
        if (!prev) return prev;
        if (prev.kitId) return prev;
        if (!prev.kit?.trim()) return prev;
        return { ...prev, kitId: hit.id, kit: hit.nombre };
      });
    }
  }, [draft, kits, setDraft]);

  if (!draft) return null;

  const setItem = (i: number, patch: Partial<Item>) => {
    const arr = [...(draft.items as any[])];
    arr[i] = { ...arr[i], ...patch };
    setDraft({ ...draft, items: arr as any });
  };

  const addItem = () =>
    setDraft({
      ...draft,
      items: [...(draft.items as any[]), { nombre: "", unidad: "UND", cantidad: 1 }],
    });

  const rmItem = (i: number) =>
    setDraft({
      ...draft,
      items: (draft.items as any[]).filter((_: any, idx: number) => idx !== i),
    });

  const onSelectKit = (kitIdStr: string) => {
    if (!kitIdStr) {
      setDraft({ ...draft, kitId: null, kit: "" });
      return;
    }
    const kitId = Number(kitIdStr);
    const kit = kits.find((k) => k.id === kitId);
    if (!kit) return;

    setDraft({
      ...draft,
      kitId: kit.id,
      kit: kit.nombre,
      items: toEntregaItemsFromKit(kit) as any,
    });
  };

  const removeSaved = (name: string, size: number) => {
    setAdjSaved((prev) => prev.filter((a) => !(a.name === name && a.size === size)));
  };

  const buscarBeneficiario = async () => {
    const tipo = (draft.beneficiario?.tipo_doc ?? "CC") as TipoDoc;
    const doc = (draft.beneficiario?.doc ?? "").trim();
    if (!doc) return toast.error("Ingrese el documento para buscar.");

    try {
      setBenefLoading(true);
      const res = await fetch(`/api/beneficiarios/buscar?tipo=${encodeURIComponent(tipo)}&doc=${encodeURIComponent(doc)}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Error buscando beneficiario.");
      }

      const data = await res.json();
      if (!data) return toast("No existe ese beneficiario. Puedes escribir el nombre manualmente.");

      const nombre = [data.nombres, data.apellidos].filter(Boolean).join(" ").trim();

      setDraft({
        ...draft,
        beneficiario: {
          ...draft.beneficiario,
          tipo_doc: (data.tipo_doc ?? tipo) as TipoDoc,
          doc: data.num_doc ?? doc,
          nombre: nombre || draft.beneficiario.nombre,
        },
        direccion: (draft.direccion?.trim() ? draft.direccion : data.direccion ?? "") || "",
      });

      toast.success("Beneficiario encontrado ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Error buscando beneficiario");
    } finally {
      setBenefLoading(false);
    }
  };

  const isNew = !(draft.id && draft.id > 0);
  const hasResponsable = !isNew || (!!sessionUser?.id && !!sessionUser?.nombre);

  const valid =
    hasResponsable &&
    !!draft.beneficiario?.nombre?.trim() &&
    !!draft.beneficiario?.doc?.trim() &&
    ((draft.items as any[])?.length ?? 0) > 0;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Entrega — ${draft.comprobante || "(sin comprobante)"}`}
      wide
      actions={
        <>
          <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={() => draft && onPrint(draft)}
            disabled={!draft || draft.estado !== "Entregado" || !(draft.items as any[])?.length}
            title={
              !(draft.items as any[])?.length
                ? "Agrega ítems para imprimir"
                : draft.estado !== "Entregado"
                ? 'Solo se imprime cuando esté en "ENTREGADO"'
                : "Imprimir comprobante"
            }
          >
            <Printer size={16} /> Imprimir
          </Button>

          <Button type="button" onClick={onSave} disabled={!valid}>
            <ClipboardCheck size={16} /> Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Datos principales */}
        <div className="grid gap-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Fecha</span>
              <Input type="date" value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Responsable</span>
              <Input
                value={isNew ? sessionUser?.nombre ?? "—" : draft.responsable ?? "—"}
                readOnly
                disabled
                className="cursor-not-allowed bg-slate-100 text-slate-500"
              />
              {isNew && !sessionUser?.id && (
                <div className="text-xs text-rose-600">No hay sesión. Inicia sesión para crear entregas.</div>
              )}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Estado</span>
              <Select value={draft.estado} onChange={(e) => setDraft({ ...draft, estado: e.target.value as Estado })}>
                {(["Pendiente", "Parcial", "Entregado"] as Estado[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Tipo doc</span>
              <Select
                value={(draft.beneficiario?.tipo_doc ?? "CC") as TipoDoc}
                onChange={(e) =>
                  setDraft({ ...draft, beneficiario: { ...draft.beneficiario, tipo_doc: e.target.value as TipoDoc } })
                }
              >
                {(["CC", "TI", "CE", "RC", "PA", "PEP", "PPT", "NIT", "OTRO"] as TipoDoc[]).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Documento</span>
              <Input
                value={draft.beneficiario.doc}
                onChange={(e) => setDraft({ ...draft, beneficiario: { ...draft.beneficiario, doc: e.target.value } })}
                placeholder="Número"
              />
            </label>

            <div className="grid gap-1 text-sm">
              <span className="text-slate-700">Buscar</span>
              <Button variant="outline" type="button" onClick={buscarBeneficiario} disabled={benefLoading}>
                <Search size={16} /> {benefLoading ? "Buscando..." : "Buscar beneficiario"}
              </Button>
            </div>

            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="text-slate-700">Beneficiario (Nombre)</span>
              <Input
                value={draft.beneficiario.nombre}
                onChange={(e) => setDraft({ ...draft, beneficiario: { ...draft.beneficiario, nombre: e.target.value } })}
                placeholder="Nombre completo"
              />
            </label>

            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="text-slate-700">Dirección (opcional)</span>
              <Input value={draft.direccion} onChange={(e) => setDraft({ ...draft, direccion: e.target.value })} placeholder="Dirección de entrega" />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Kit (desde BD)</span>
              <Select value={draft.kitId ? String(draft.kitId) : ""} onChange={(e) => onSelectKit(e.target.value)} disabled={kitsLoading}>
                <option value="">{kitsLoading ? "Cargando kits..." : "— Seleccionar —"}</option>
                {kits.map((k) => (
                  <option key={k.id} value={String(k.id)}>
                    {k.nombre}
                  </option>
                ))}
              </Select>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => reloadKits()} disabled={kitsLoading}>
                  {kitsLoading ? "..." : "Recargar kits"}
                </Button>

                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    if (!draft.kitId) return toast.error("Selecciona un kit primero");
                    const kit = kits.find((k) => k.id === draft.kitId);
                    if (!kit) return toast.error("Kit no encontrado");
                    setDraft({ ...draft, kit: kit.nombre, items: toEntregaItemsFromKit(kit) as any });
                    toast.success("Items cargados desde el kit ✅");
                  }}
                  disabled={!draft.kitId}
                  title="Vuelve a cargar los items del kit (sobrescribe la lista actual)"
                >
                  Cargar items
                </Button>
              </div>

              {!!draft.kit && (
                <div className="mt-1 text-xs text-slate-500">
                  Snapshot guardado en entrega: <b>{draft.kit}</b>
                </div>
              )}
            </label>
          </div>

          {/* Ítems */}
          <div className="rounded border border-[var(--subtle)] bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--subtle)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck size={16} className="text-[var(--brand)]" /> Ítems del kit
              </div>
              <Button variant="outline" type="button" onClick={addItem}>
                <Plus size={16} /> Agregar
              </Button>
            </div>

            <div className="p-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-slate-500 border-b border-[var(--subtle)]">
                  <tr>
                    <th className="px-2 py-2 text-left">Producto</th>
                    <th className="w-24 px-2 py-2 text-left">Unidad</th>
                    <th className="px-2 py-2 text-left w-28">Cantidad</th>
                    <th className="w-16 px-2 py-2 text-left">—</th>
                  </tr>
                </thead>
                <tbody>
                  {(draft.items as any[]).map((it, i) => (
                    <tr key={i} className="border-b border-[var(--subtle)]/60">
                      <td className="px-2 py-2">
                        <Input value={it.nombre} onChange={(e) => setItem(i, { nombre: e.target.value } as any)} placeholder="Nombre del producto" />
                      </td>
                      <td className="px-2 py-2">
                        <Input value={it.unidad} onChange={(e) => setItem(i, { unidad: e.target.value } as any)} placeholder="UND/KG/L..." />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" value={it.cantidad} onChange={(e) => setItem(i, { cantidad: Number(e.target.value) } as any)} />
                      </td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" type="button" onClick={() => rmItem(i)} title="Quitar">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {(draft.items as any[]).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        Sin ítems. Selecciona un kit o usa “Agregar”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Observaciones</span>
            <Textarea
              rows={3}
              value={draft.observaciones || ""}
              onChange={(e) => setDraft({ ...draft, observaciones: e.target.value })}
              placeholder="Notas adicionales de la entrega…"
            />
          </label>
        </div>

        {/* Adjuntos */}
        <div className="grid gap-4">
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Upload size={16} className="text-[var(--brand)]" /> Adjuntos (Dropzone)
            </div>

            <DocumentDropzone value={adjNew} onChange={setAdjNew} maxFiles={10} maxSizeMB={10} />

            <div className="mt-2 text-xs text-slate-500">
              En esta versión se guarda la lista/metadata. Si quieres descarga real, luego lo conectamos a storage.
            </div>

            {adjSaved.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-md border border-[var(--subtle)] bg-white">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-500 border-b border-[var(--subtle)]">
                    <tr>
                      <th className="px-2 py-2 text-left">Archivo</th>
                      <th className="px-2 py-2 text-left">Tamaño</th>
                      <th className="w-24 px-2 py-2 text-left">—</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjSaved.map((a, idx) => (
                      <tr key={`${a.name}-${a.size}-${idx}`} className="border-b border-[var(--subtle)]/60 last:border-b-0">
                        <td className="px-2 py-2">{a.name}</td>
                        <td className="px-2 py-2">{(a.size / 1024).toFixed(1)} KB</td>
                        <td className="px-2 py-2">
                          <Button variant="ghost" type="button" onClick={() => removeSaved(a.name, a.size)}>
                            <Trash2 size={14} /> Quitar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-2 text-xs text-slate-500">Ej.: Acta firmada, consentimiento, soporte de entrega, etc.</div>
          </div>

          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
              <Printer size={16} className="text-[var(--brand)]" /> Comprobante
            </div>
            <p className="text-xs text-slate-600">Podrás imprimir el comprobante desde la tabla (acción “Imprimir”).</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
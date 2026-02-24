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

import {
  getEntregas,
  createEntrega,
  updateEntrega,
  type Entrega,
  type Estado,
  type Item,
  type Adj,
  type TipoDoc,
} from "@/lib/entregas.api";

/* ============ Helpers UI ============ */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
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
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
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
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${map[tone]}`}>{children}</span>;
}
function Section({ title, icon, actions, children }: { title: string; icon: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={[
            wide ? "w-[min(1100px,96vw)]" : "w-[min(720px,92vw)]",
            "max-h-[92vh] overflow-hidden",
            "rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-2xl",
            "flex flex-col",
          ].join(" ")}
        >
          {/* header (fixed) */}
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

          {/* content (scroll) */}
          <div className="flex-1 min-h-0 p-5 overflow-y-auto">{children}</div>

          {/* footer (fixed) */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-5 py-4">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Utilidades ============ */
const today = () => new Date().toISOString().slice(0, 10);

const TEMPLATES: Record<string, Item[]> = {
  "Kit Aseo": [
    { id: crypto.randomUUID(), nombre: "JABÓN DE BAÑO", unidad: "UND", cantidad: 2 },
    { id: crypto.randomUUID(), nombre: "SHAMPOO 400ML", unidad: "UND", cantidad: 1 },
    { id: crypto.randomUUID(), nombre: "CREMA DENTAL", unidad: "UND", cantidad: 1 },
  ],
  "Kit Alimentario": [
    { id: crypto.randomUUID(), nombre: "ARROZ 1KG", unidad: "KG", cantidad: 2 },
    { id: crypto.randomUUID(), nombre: "LENTEJA 500G", unidad: "G", cantidad: 500 },
    { id: crypto.randomUUID(), nombre: "ACEITE 1L", unidad: "L", cantidad: 1 },
  ],
  "Kit Adulto Mayor": [
    { id: crypto.randomUUID(), nombre: "PAÑAL ADULTO", unidad: "UND", cantidad: 20 },
    { id: crypto.randomUUID(), nombre: "TOALLAS HÚMEDAS", unidad: "PAQ", cantidad: 1 },
  ],
};

function emptyDraft(): Entrega {
  return {
    id: 0,
    comprobante: "",
    fecha: today(),
    beneficiario: { tipo_doc: "CC", doc: "", nombre: "" },
    direccion: "",
    responsable: "",
    estado: "Pendiente",
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
  // evita corrimientos por zona horaria
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

  const beneficiarioDoc = `${r.beneficiario?.tipo_doc ? esc(r.beneficiario.tipo_doc) + " " : ""}${esc(r.beneficiario?.doc)}`;

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
    .col6{ grid-column: span 6; }
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

/* ============ Página ============ */
export default function EntregasPage() {
  const title = "Entregas de insumos/kits";

  const [rows, setRows] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | Estado>("");
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Entrega | null>(null);

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
    setDraft(emptyDraft());
    setOpen(true);
  };

  const editar = (e: Entrega) => {
    setDraft(JSON.parse(JSON.stringify(e)));
    setOpen(true);
  };

  const guardar = async () => {
    if (!draft) return;

    if (!draft.responsable?.trim()) return toast.error("Responsable es obligatorio");
    if (!draft.beneficiario?.doc?.trim()) return toast.error("Documento del beneficiario es obligatorio");
    if (!draft.beneficiario?.nombre?.trim()) return toast.error("Nombre del beneficiario es obligatorio");
    if (!draft.items?.length) return toast.error("Debes agregar al menos 1 ítem");

    const payload: any = {
      comprobante: draft.comprobante || undefined,
      fecha: draft.fecha,
      responsable: draft.responsable,
      estado: draft.estado,
      kit: draft.kit || undefined,
      beneficiario: draft.beneficiario, // incluye tipo_doc opcional
      direccion: draft.direccion || undefined,
      items: draft.items,
      observaciones: draft.observaciones || undefined,
      adjuntos: draft.adjuntos ?? [],
    };

    const saved = draft.id && draft.id > 0 ? await updateEntrega(draft.id, payload) : await createEntrega(payload);
    if (!saved) return;

    setDraft(saved);
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
    const saved = await updateEntrega(row.id, { estado: est });
    if (!saved) return;
    setRows((prev) => prev.map((x) => (x.id === row.id ? saved : x)));
  };

  const imprimir = (row: Entrega) => {

    if (!row.items || row.items.length === 0) {
      toast.error("No puedes imprimir: la entrega no tiene ítems.");
      return;
    }   

    if (row.estado !== "Entregado") {
      toast.error('Solo puedes imprimir cuando el estado sea "Entregado".');
      return;
    }
    
    try {
      const html = renderComprobanteHtml(row);

      // 1) Abrimos ventana
      const w = window.open("", "_blank"); // ✅ sin noopener/noreferrer (Brave a veces molesta)
      if (!w) {
        toast.error("El navegador bloqueó la ventana. Permite pop-ups.");
        return;
      }

      // 2) Método recomendado: Blob URL (más estable)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Navegamos la ventana al blob
      w.location.href = url;

      // imprimimos cuando cargue
      const doPrint = () => {
        try {
          w.focus();
          w.print();
        } catch {}
      };

      w.onload = () => {
        setTimeout(doPrint, 200);
        // limpia URL
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      };

      // 3) Fallback: si por algo no carga, escribimos directo
      setTimeout(() => {
        try {
          if (w.document?.readyState === "complete") return;
          w.document.open();
          w.document.write(html);
          w.document.close();
          setTimeout(doPrint, 200);
        } catch {}
      }, 800);

      // opcional: cerrar al terminar
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
      <div className="grid gap-6">
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
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <Input type="date" value={r1} onChange={(e) => setR1(e.target.value)} />
                <Input type="date" value={r2} onChange={(e) => setR2(e.target.value)} />
              </div>
              <Button variant="outline" onClick={exportCSV}><FileDown size={16} /> Exportar</Button>
              <Button onClick={nueva}><Plus size={16} /> Nueva entrega</Button>
            </>
          }
        >
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
            <div className="rounded border border-[var(--subtle)] bg-white p-3 text-sm">
              <div className="text-slate-500">Total</div>
              <div className="text-xl font-semibold">{totals.t}</div>
            </div>
            <div className="rounded border border-[var(--subtle)] bg-white p-3 text-sm">
              <div className="text-slate-500">Pendientes</div>
              <div className="text-xl font-semibold">{totals.p}</div>
            </div>
            <div className="rounded border border-[var(--subtle)] bg-white p-3 text-sm">
              <div className="text-slate-500">Parciales</div>
              <div className="text-xl font-semibold">{totals.parc}</div>
            </div>
            <div className="rounded border border-[var(--subtle)] bg-white p-3 text-sm">
              <div className="text-slate-500">Entregadas</div>
              <div className="text-xl font-semibold">{totals.e}</div>
            </div>
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
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Cargando…</td></tr>
                )}

                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--subtle)]/70">
                    <td className="py-2 pl-4 pr-3 font-medium">{r.comprobante}</td>
                    <td className="px-3 py-2">{r.fecha}</td>
                    <td className="px-3 py-2">
                      {r.beneficiario.nombre} <span className="text-slate-500">({r.beneficiario.doc || "s/d"})</span>
                    </td>
                    <td className="px-3 py-2">
                      {r.estado === "Entregado" ? (
                        <Badge tone="emerald"><CheckCircle2 className="mr-1" size={12} /> Entregado</Badge>
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
                        <Button variant="outline" onClick={() => editar(r)}><Pencil size={14} /> Detalle</Button>
                        <Select value={r.estado} onChange={(e) => cambiarEstado(r, e.target.value as Estado)} className="w-32">
                          {(["Pendiente","Parcial","Entregado"] as Estado[]).map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Button variant="ghost" onClick={() => imprimir(r)}><Printer size={14} /> Imprimir</Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Sin resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <EntregaModal open={open} setOpen={setOpen} draft={draft} setDraft={setDraft} onSave={guardar} onPrint={imprimir} />
    </DashboardShell>
  );
}

/* ============ Modal de Entrega (con Buscar Beneficiario) ============ */
function EntregaModal({
  open,
  setOpen,
  draft,
  setDraft,
  onSave,
  onPrint,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Entrega | null;
  setDraft: (d: Entrega | null) => void;
  onSave: () => void;
  onPrint: (row: Entrega) => void;
}) {
  const [benefLoading, setBenefLoading] = useState(false);

  if (!draft) return null;

  const setItem = (i: number, patch: Partial<Item>) => {
    const arr = [...draft.items];
    arr[i] = { ...arr[i], ...patch };
    setDraft({ ...draft, items: arr });
  };

  const addItem = () =>
    setDraft({
      ...draft,
      items: [...draft.items, { id: crypto.randomUUID(), nombre: "", unidad: "UND", cantidad: 1 }],
    });

  const rmItem = (i: number) => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) });

  const onTemplate = (k: string) => setDraft({ ...draft, kit: k, items: JSON.parse(JSON.stringify(TEMPLATES[k] || [])) });

  const onAdj = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
    setDraft({ ...draft, adjuntos: [...draft.adjuntos, ...arr] });
  };

  const rmAdj = (name: string) => setDraft({ ...draft, adjuntos: draft.adjuntos.filter((a) => a.name !== name) });

  const buscarBeneficiario = async () => {
    const tipo = (draft.beneficiario?.tipo_doc ?? "CC") as TipoDoc;
    const doc = (draft.beneficiario?.doc ?? "").trim();

    if (!doc) return toast.error("Ingrese el documento para buscar.");

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
        toast("No existe ese beneficiario. Puedes escribir el nombre manualmente.");
        return;
      }

      const nombre = [data.nombres, data.apellidos].filter(Boolean).join(" ").trim();

      setDraft({
        ...draft,
        beneficiario: {
          ...draft.beneficiario,
          tipo_doc: (data.tipo_doc ?? tipo) as TipoDoc,
          doc: data.num_doc ?? doc,
          nombre: nombre || draft.beneficiario.nombre,
        },
        // si trae dirección y está vacía, la ponemos
        direccion: (draft.direccion?.trim() ? draft.direccion : (data.direccion ?? "")) || "",
      });

      toast.success("Beneficiario encontrado ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Error buscando beneficiario");
    } finally {
      setBenefLoading(false);
    }
  };

  const valid = draft.beneficiario.nombre && draft.beneficiario.doc && draft.items.length > 0 && draft.responsable.trim();

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
            disabled={!draft || draft.estado !== "Entregado" || !draft.items?.length}
            title={
              !draft?.items?.length
                ? "Agrega ítems para imprimir"
                : draft?.estado !== "Entregado"
                ? "Solo se imprime cuando esté en ENTREGADO"
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
              <Input value={draft.responsable} onChange={(e) => setDraft({ ...draft, responsable: e.target.value })} placeholder="Bodega / Usuario" />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Estado</span>
              <Select value={draft.estado} onChange={(e) => setDraft({ ...draft, estado: e.target.value as Estado })}>
                {(["Pendiente","Parcial","Entregado"] as Estado[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </label>

            {/* Beneficiario: tipo + doc + buscar */}
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Tipo doc</span>
              <Select
                value={(draft.beneficiario?.tipo_doc ?? "CC") as TipoDoc}
                onChange={(e) => setDraft({ ...draft, beneficiario: { ...draft.beneficiario, tipo_doc: e.target.value as TipoDoc } })}
              >
                {(["CC","TI","CE","RC","PA","PEP","PPT","NIT","OTRO"] as TipoDoc[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
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
              <span className="text-slate-700">Plantilla de kit</span>
              <Select value={draft.kit || ""} onChange={(e) => onTemplate(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {Object.keys(TEMPLATES).map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
            </label>
          </div>

          {/* Ítems */}
          <div className="rounded border border-[var(--subtle)] bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--subtle)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck size={16} className="text-[var(--brand)]" /> Ítems del kit
              </div>
              <Button variant="outline" type="button" onClick={addItem}><Plus size={16} /> Agregar</Button>
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
                  {draft.items.map((it, i) => (
                    <tr key={it.id} className="border-b border-[var(--subtle)]/60">
                      <td className="px-2 py-2">
                        <Input value={it.nombre} onChange={(e) => setItem(i, { nombre: e.target.value })} placeholder="Nombre del producto" />
                      </td>
                      <td className="px-2 py-2">
                        <Input value={it.unidad} onChange={(e) => setItem(i, { unidad: e.target.value })} placeholder="UND/KG/L..." />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" value={it.cantidad} onChange={(e) => setItem(i, { cantidad: Number(e.target.value) })} />
                      </td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" type="button" onClick={() => rmItem(i)} title="Quitar"><Trash2 size={16} /></Button>
                      </td>
                    </tr>
                  ))}
                  {draft.items.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-500">Sin ítems. Usa “Agregar”.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Observaciones</span>
            <Textarea rows={3} value={draft.observaciones || ""} onChange={(e) => setDraft({ ...draft, observaciones: e.target.value })} placeholder="Notas adicionales de la entrega…" />
          </label>
        </div>

        {/* Adjuntos */}
        <div className="grid gap-4">
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Upload size={16} className="text-[var(--brand)]" /> Adjuntos (PDF/otros)
            </div>
            <input type="file" multiple onChange={(e) => onAdj(e.target.files)} />
            {draft.adjuntos.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-500 border-b border-[var(--subtle)]">
                    <tr>
                      <th className="px-2 py-2 text-left">Archivo</th>
                      <th className="px-2 py-2 text-left">Tamaño</th>
                      <th className="w-24 px-2 py-2 text-left">—</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.adjuntos.map((a) => (
                      <tr key={a.name} className="border-b border-[var(--subtle)]/60">
                        <td className="px-2 py-2">{a.name}</td>
                        <td className="px-2 py-2">{(a.size / 1024).toFixed(1)} KB</td>
                        <td className="px-2 py-2">
                          <Button variant="ghost" type="button" onClick={() => rmAdj(a.name)}><Trash2 size={14} /> Quitar</Button>
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
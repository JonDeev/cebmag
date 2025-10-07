"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Package, Plus, Search, Truck, ClipboardCheck, Printer, Upload, Trash2, Pencil, CheckCircle2, Clock, FileDown,
} from "lucide-react";

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
  open, onClose, title, wide, actions, children,
}: { open: boolean; onClose: () => void; title: string; wide?: boolean; actions?: React.ReactNode; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`absolute left-1/2 top-1/2 ${wide ? "w-[min(980px,96vw)]" : "w-[min(680px,92vw)]"} -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl`}>
        <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
          <h4 className="text-sm font-semibold">{title}</h4>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><Clock size={14} className="opacity-0" /></button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3">{actions}</div>
      </div>
    </div>
  );
}

/* ============ Tipos y utilidades ============ */
type Estado = "Pendiente" | "Parcial" | "Entregado";
type Item = { id: string; nombre: string; unidad: string; cantidad: number };
type Adj = { name: string; size: number };
type Entrega = {
  id: string;
  comprobante: string;
  fecha: string;               // YYYY-MM-DD
  beneficiario: { doc: string; nombre: string };
  direccion?: string;
  responsable: string;
  estado: Estado;
  kit?: string;
  items: Item[];
  observaciones?: string;
  adjuntos: Adj[];
};

const today = () => new Date().toISOString().slice(0, 10);
const nextComprobante = (list: Entrega[]) => {
  const seq = (list.length + 1).toString().padStart(4, "0");
  return `EN-2025-${seq}`;
};

const TEMPLATES: Record<string, Item[]> = {
  "Kit Aseo": [
    { id: crypto.randomUUID(), nombre: "Jabón de baño", unidad: "und", cantidad: 2 },
    { id: crypto.randomUUID(), nombre: "Shampoo 400ml", unidad: "und", cantidad: 1 },
    { id: crypto.randomUUID(), nombre: "Crema dental", unidad: "und", cantidad: 1 },
  ],
  "Kit Alimentario": [
    { id: crypto.randomUUID(), nombre: "Arroz 1kg", unidad: "kg", cantidad: 2 },
    { id: crypto.randomUUID(), nombre: "Lenteja 500g", unidad: "g", cantidad: 500 },
    { id: crypto.randomUUID(), nombre: "Aceite 1L", unidad: "L", cantidad: 1 },
  ],
  "Kit Adulto Mayor": [
    { id: crypto.randomUUID(), nombre: "Pañal adulto", unidad: "und", cantidad: 20 },
    { id: crypto.randomUUID(), nombre: "Toallas húmedas", unidad: "paq", cantidad: 1 },
  ],
};

/* ============ Mock inicial ============ */
const MOCK: Entrega[] = [
  {
    id: crypto.randomUUID(),
    comprobante: "EN-2025-0001",
    fecha: today(),
    beneficiario: { doc: "1050", nombre: "Juan Torres" },
    direccion: "Calle 10 # 10-10",
    responsable: "Bodega Norte",
    estado: "Entregado",
    kit: "Kit Aseo",
    items: TEMPLATES["Kit Aseo"],
    observaciones: "Entrega completa.",
    adjuntos: [],
  },
  {
    id: crypto.randomUUID(),
    comprobante: "EN-2025-0002",
    fecha: today(),
    beneficiario: { doc: "2050", nombre: "María Gómez" },
    responsable: "Bodega Norte",
    estado: "Pendiente",
    kit: "Kit Alimentario",
    items: TEMPLATES["Kit Alimentario"],
    adjuntos: [],
  },
];

/* ============ Página ============ */
export default function EntregasPage() {
  const title = "Entregas de insumos/kits";
  const [rows, setRows] = useState<Entrega[]>(MOCK);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | Estado>("");
  const [r1, setR1] = useState(""); // desde fecha
  const [r2, setR2] = useState(""); // hasta fecha

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Entrega | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const hitQ =
        !q ||
        [r.comprobante, r.beneficiario.nombre, r.beneficiario.doc, r.responsable, r.kit || "", r.observaciones || ""]
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

  /* ---- Acciones ---- */
  const nueva = () => {
    const d: Entrega = {
      id: crypto.randomUUID(),
      comprobante: nextComprobante(rows),
      fecha: today(),
      beneficiario: { doc: "", nombre: "" },
      direccion: "",
      responsable: "",
      estado: "Pendiente",
      kit: "",
      items: [],
      observaciones: "",
      adjuntos: [],
    };
    setDraft(d);
    setOpen(true);
  };
  const editar = (e: Entrega) => {
    setDraft(JSON.parse(JSON.stringify(e)));
    setOpen(true);
  };
  const guardar = () => {
    if (!draft) return;
    setRows((prev) => {
      const i = prev.findIndex((x) => x.id === draft.id);
      return i === -1 ? [draft, ...prev] : prev.map((x) => (x.id === draft.id ? draft : x));
    });
    setOpen(false);
  };
  const cambiarEstado = (row: Entrega, est: Estado) =>
    setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, estado: est } : x)));

  const imprimir = (row: Entrega) => {
    alert(`Imprimir comprobante ${row.comprobante} (UI sin backend).`);
    // aquí podrías abrir window.print() con un layout; por ahora lo simulamos
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
        .join(","),
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
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input className="pl-8 w-64" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                  <th className="text-left py-2 pl-4 pr-3">Comprobante</th>
                  <th className="text-left py-2 px-3">Fecha</th>
                  <th className="text-left py-2 px-3">Beneficiario</th>
                  <th className="text-left py-2 px-3">Estado</th>
                  <th className="text-left py-2 px-3">Responsable</th>
                  <th className="text-left py-2 px-3">Ítems</th>
                  <th className="text-left py-2 px-3 w-64">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--subtle)]/70">
                    <td className="py-2 pl-4 pr-3 font-medium">{r.comprobante}</td>
                    <td className="py-2 px-3">{r.fecha}</td>
                    <td className="py-2 px-3">
                      {r.beneficiario.nombre} <span className="text-slate-500">({r.beneficiario.doc || "s/d"})</span>
                    </td>
                    <td className="py-2 px-3">
                      {r.estado === "Entregado" ? (
                        <Badge tone="emerald"><CheckCircle2 className="mr-1" size={12} /> Entregado</Badge>
                      ) : r.estado === "Parcial" ? (
                        <Badge tone="amber">Parcial</Badge>
                      ) : (
                        <Badge tone="slate">Pendiente</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3">{r.responsable || "—"}</td>
                    <td className="py-2 px-3">{r.items.length}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => editar(r)}><Pencil size={14} /> Detalle</Button>
                        <Select
                          value={r.estado}
                          onChange={(e) => cambiarEstado(r, e.target.value as Estado)}
                          className="w-32"
                        >
                          {(["Pendiente", "Parcial", "Entregado"] as Estado[]).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </Select>
                        <Button variant="ghost" onClick={() => imprimir(r)}><Printer size={14} /> Imprimir</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">Sin resultados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <EntregaModal open={open} setOpen={setOpen} draft={draft} setDraft={setDraft} onSave={guardar} />
    </DashboardShell>
  );
}

/* ============ Modal de Entrega ============ */
function EntregaModal({
  open, setOpen, draft, setDraft, onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Entrega | null;
  setDraft: (d: Entrega | null) => void;
  onSave: () => void;
}) {
  if (!draft) return null;

  const setItem = (i: number, patch: Partial<Item>) => {
    const arr = [...draft.items];
    arr[i] = { ...arr[i], ...patch };
    setDraft({ ...draft, items: arr });
  };
  const addItem = () =>
    setDraft({
      ...draft,
      items: [...draft.items, { id: crypto.randomUUID(), nombre: "", unidad: "und", cantidad: 1 }],
    });
  const rmItem = (i: number) => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) });

  const onTemplate = (k: string) => setDraft({ ...draft, kit: k, items: JSON.parse(JSON.stringify(TEMPLATES[k] || [])) });

  const onAdj = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
    setDraft({ ...draft, adjuntos: [...draft.adjuntos, ...arr] });
  };
  const rmAdj = (name: string) =>
    setDraft({ ...draft, adjuntos: draft.adjuntos.filter((a) => a.name !== name) });

  const valid = draft.beneficiario.nombre && draft.beneficiario.doc && draft.items.length > 0;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Entrega — ${draft.comprobante}`}
      wide
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={!valid}><ClipboardCheck size={16} /> Guardar</Button>
        </>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Datos principales */}
        <div className="lg:col-span-2 grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {(["Pendiente", "Parcial", "Entregado"] as Estado[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </label>

            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="text-slate-700">Beneficiario (Nombre)</span>
              <Input value={draft.beneficiario.nombre} onChange={(e) => setDraft({ ...draft, beneficiario: { ...draft.beneficiario, nombre: e.target.value } })} placeholder="Nombre completo" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Documento</span>
              <Input value={draft.beneficiario.doc} onChange={(e) => setDraft({ ...draft, beneficiario: { ...draft.beneficiario, doc: e.target.value } })} placeholder="CC/TI/CE" />
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
              <div className="text-sm font-semibold flex items-center gap-2"><Truck size={16} className="text-[var(--brand)]" /> Ítems del kit</div>
              <Button variant="outline" onClick={addItem}><Plus size={16} /> Agregar</Button>
            </div>
            <div className="p-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-slate-500 border-b border-[var(--subtle)]">
                  <tr>
                    <th className="text-left py-2 px-2">Producto</th>
                    <th className="text-left py-2 px-2 w-24">Unidad</th>
                    <th className="text-left py-2 px-2 w-28">Cantidad</th>
                    <th className="text-left py-2 px-2 w-16">—</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((it, i) => (
                    <tr key={it.id} className="border-b border-[var(--subtle)]/60">
                      <td className="py-2 px-2">
                        <Input value={it.nombre} onChange={(e) => setItem(i, { nombre: e.target.value })} placeholder="Nombre del producto" />
                      </td>
                      <td className="py-2 px-2">
                        <Input value={it.unidad} onChange={(e) => setItem(i, { unidad: e.target.value })} placeholder="und/kg/L..." />
                      </td>
                      <td className="py-2 px-2">
                        <Input type="number" value={it.cantidad} onChange={(e) => setItem(i, { cantidad: Number(e.target.value) })} />
                      </td>
                      <td className="py-2 px-2">
                        <Button variant="ghost" onClick={() => rmItem(i)} title="Quitar"><Trash2 size={16} /></Button>
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
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Upload size={16} className="text-[var(--brand)]" /> Adjuntos (PDF/otros)</div>
            <input type="file" multiple onChange={(e) => onAdj(e.target.files)} />
            {draft.adjuntos.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-500 border-b border-[var(--subtle)]">
                    <tr>
                      <th className="text-left py-2 px-2">Archivo</th>
                      <th className="text-left py-2 px-2">Tamaño</th>
                      <th className="text-left py-2 px-2 w-24">—</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.adjuntos.map((a) => (
                      <tr key={a.name} className="border-b border-[var(--subtle)]/60">
                        <td className="py-2 px-2">{a.name}</td>
                        <td className="py-2 px-2">{(a.size / 1024).toFixed(1)} KB</td>
                        <td className="py-2 px-2">
                          <Button variant="ghost" onClick={() => rmAdj(a.name)}><Trash2 size={14} /> Quitar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-xs text-slate-500 mt-2">Ej.: Acta firmada, consentimiento, soporte de entrega, etc.</div>
          </div>

          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="text-sm font-semibold mb-1 flex items-center gap-2"><Printer size={16} className="text-[var(--brand)]" /> Comprobante</div>
            <p className="text-xs text-slate-600">Podrás imprimir el comprobante desde la tabla (acción “Imprimir”).</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

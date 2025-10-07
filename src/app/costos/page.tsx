"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Wallet, Plus, FileDown, Pencil, Trash2, CheckCircle2, Building2, Calendar, X, BarChart3,
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
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3">{actions}</div>
      </div>
    </div>
  );
}
const money = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/* ============ Tipos ============ */
type EstadoAct = "Abierta" | "Cerrada";
type Actividad = { id: string; codigo: string; nombre: string; presupuesto: number; estado: EstadoAct };
type Gasto = {
  id: string;
  fecha: string; // YYYY-MM-DD
  actividadId: string;
  categoria: string;
  descripcion: string;
  proveedor?: string;
  metodo?: "Efectivo" | "Transferencia" | "Cheque" | "Otro";
  documento?: string; // factura/soporte
  valor: number;
  adjuntos: { name: string; size: number }[];
};

/* ============ Datos iniciales (8 actividades) ============ */
const hoy = new Date().toISOString().slice(0, 10);
const ACTS_BASE: Actividad[] = [
  { id: crypto.randomUUID(), codigo: "A1", nombre: "Actividad 1", presupuesto: 12_000_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A2", nombre: "Actividad 2", presupuesto: 18_000_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A3", nombre: "Actividad 3", presupuesto: 22_000_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A4", nombre: "Actividad 4", presupuesto: 10_000_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A5", nombre: "Actividad 5", presupuesto: 8_000_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A6", nombre: "Actividad 6", presupuesto: 7_500_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A7", nombre: "Actividad 7", presupuesto: 9_500_000, estado: "Abierta" },
  { id: crypto.randomUUID(), codigo: "A8", nombre: "Actividad 8", presupuesto: 6_000_000, estado: "Abierta" },
];

const CATS = ["Personal", "Honorarios", "Transporte", "Insumos", "Alquiler", "Papelería", "Logística", "Otros"] as const;

const MOCK_GASTOS: Gasto[] = [
  {
    id: crypto.randomUUID(),
    fecha: hoy,
    actividadId: ACTS_BASE[2].id, // A3
    categoria: "Insumos",
    descripcion: "Compra de medicamentos básicos",
    proveedor: "Farmacia Central",
    metodo: "Transferencia",
    documento: "FV-00123",
    valor: 1_800_000,
    adjuntos: [],
  },
  {
    id: crypto.randomUUID(),
    fecha: hoy,
    actividadId: ACTS_BASE[6].id, // A7
    categoria: "Honorarios",
    descripcion: "Profesional Fisioterapeuta (sesiones)",
    proveedor: "Clinisalud",
    metodo: "Transferencia",
    documento: "CT-7788",
    valor: 2_400_000,
    adjuntos: [],
  },
];

/* ============ Página ============ */
export default function CostosPage() {
  const title = "Costos y gastos por actividad";

  const [acts, setActs] = useState<Actividad[]>(ACTS_BASE);
  const [rows, setRows] = useState<Gasto[]>(MOCK_GASTOS);

  // filtros
  const [q, setQ] = useState("");
  const [actId, setActId] = useState<string>("");
  const [cat, setCat] = useState<string>("");
  const [d1, setD1] = useState<string>("");
  const [d2, setD2] = useState<string>("");

  // modal gasto
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Gasto | null>(null);

  // modal presupuestos
  const [openCfg, setOpenCfg] = useState(false);

  // cálculos
  const execByAct = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach((g) => (m[g.actividadId] = (m[g.actividadId] || 0) + g.valor));
    return m;
  }, [rows]);

  const kpis = useMemo(() => {
    const totalPres = acts.reduce((a, b) => a + b.presupuesto, 0);
    const totalExec = rows.reduce((a, b) => a + b.valor, 0);
    const disp = totalPres - totalExec;
    const pct = totalPres ? Math.round((totalExec / totalPres) * 100) : 0;
    return { totalPres, totalExec, disp, pct };
  }, [acts, rows]);

  const list = useMemo(() => {
    return rows.filter((r) => {
      const hitQ =
        !q ||
        [r.descripcion, r.proveedor || "", r.documento || "", r.categoria]
          .join(" ")
          .toLowerCase()
          .includes(q.trim().toLowerCase());
      const hitAct = !actId || r.actividadId === actId;
      const hitCat = !cat || r.categoria === cat;
      const hitD1 = !d1 || r.fecha >= d1;
      const hitD2 = !d2 || r.fecha <= d2;
      return hitQ && hitAct && hitCat && hitD1 && hitD2;
    });
  }, [rows, q, actId, cat, d1, d2]);

  /* ---- Acciones ---- */
  const nueva = () => {
    const firstAct = acts[0]?.id ?? "";
    setDraft({
      id: crypto.randomUUID(),
      fecha: hoy,
      actividadId: actId || firstAct,
      categoria: "Insumos",
      descripcion: "",
      proveedor: "",
      metodo: "Transferencia",
      documento: "",
      valor: 0,
      adjuntos: [],
    });
    setOpen(true);
  };
  const editar = (g: Gasto) => {
    setDraft(JSON.parse(JSON.stringify(g)));
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
  const quitar = (id: string) => setRows((prev) => prev.filter((g) => g.id !== id));

  const exportCSV = () => {
    const head = ["fecha", "actividad", "categoria", "descripcion", "proveedor", "metodo", "documento", "valor"];
    const lines = list.map((r) => {
      const act = acts.find((a) => a.id === r.actividadId);
      return [
        r.fecha,
        `${act?.codigo ?? ""} ${act?.nombre ?? ""}`,
        r.categoria,
        r.descripcion,
        r.proveedor ?? "",
        r.metodo ?? "",
        r.documento ?? "",
        r.valor,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [head.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `costos_${hoy}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cerrarAct = (id: string) =>
    setActs((prev) => prev.map((a) => (a.id === id ? { ...a, estado: "Cerrada" } : a)));

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="text-sm text-slate-500">Presupuesto total</div>
            <div className="text-xl font-semibold">{money(kpis.totalPres)}</div>
          </div>
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="text-sm text-slate-500">Ejecutado</div>
            <div className="text-xl font-semibold">{money(kpis.totalExec)}</div>
          </div>
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="text-sm text-slate-500">Disponible</div>
            <div className="text-xl font-semibold">{money(kpis.disp)}</div>
          </div>
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="text-sm text-slate-500">Ejecución</div>
            <div className="text-xl font-semibold">{kpis.pct}%</div>
          </div>
        </div>

        {/* Actividades (resumen y cierre) */}
        <Section
          title="Actividades (presupuesto y estado)"
          icon={<BarChart3 size={18} />}
          actions={
            <Button variant="outline" onClick={() => setOpenCfg(true)}>
              <Pencil size={16} /> Definir/editar presupuestos
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {acts.map((a) => {
              const gasto = execByAct[a.id] || 0;
              const disp = a.presupuesto - gasto;
              const pct = a.presupuesto ? Math.min(100, Math.round((gasto / a.presupuesto) * 100)) : 0;
              return (
                <div key={a.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {a.codigo} • {a.nombre}
                    </div>
                    {a.estado === "Cerrada" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-[12px]">
                        <CheckCircle2 size={14} /> Cerrada
                      </span>
                    ) : (
                      <button
                        onClick={() => cerrarAct(a.id)}
                        title="Marcar como cerrada"
                        className="text-xs text-slate-600 hover:text-emerald-700"
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Presupuesto: <b>{money(a.presupuesto)}</b>
                  </div>
                  <div className="text-xs text-slate-600">
                    Ejecutado: <b>{money(gasto)}</b> • Disponible: <b>{money(disp)}</b>
                  </div>
                  <div className="h-2 mt-2 overflow-hidden rounded bg-slate-100">
                    <div className="h-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Registro de gastos */}
        <Section
          title="Registro de costos y gastos"
          icon={<Wallet size={18} />}
          actions={
            <>
              <div className="items-center hidden gap-2 md:flex">
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input type="date" value={d1} onChange={(e) => setD1(e.target.value)} className="w-40 pl-8" />
                </div>
                <Input type="date" value={d2} onChange={(e) => setD2(e.target.value)} className="w-40" />
                <Select value={actId} onChange={(e) => setActId(e.target.value)} className="w-56">
                  <option value="">Actividad: Todas</option>
                  {acts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} • {a.nombre}
                    </option>
                  ))}
                </Select>
                <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
                  <option value="">Categoría: Todas</option>
                  {CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
              </div>
              <Button variant="outline" onClick={exportCSV}>
                <FileDown size={16} /> Exportar
              </Button>
              <Button onClick={nueva}>
                <Plus size={16} /> Nuevo gasto
              </Button>
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                  <th className="py-2 pl-4 pr-3 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Actividad</th>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-left">Proveedor</th>
                  <th className="px-3 py-2 text-left">Documento</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="w-48 px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map((g) => {
                  const a = acts.find((x) => x.id === g.actividadId);
                  return (
                    <tr key={g.id} className="border-b border-[var(--subtle)]/70">
                      <td className="py-2 pl-4 pr-3">{g.fecha}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="whitespace-nowrap">{a ? `${a.codigo} • ${a.nombre}` : "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{g.categoria}</td>
                      <td className="px-3 py-2">{g.descripcion}</td>
                      <td className="px-3 py-2">{g.proveedor || "—"}</td>
                      <td className="px-3 py-2">{g.documento || "—"}</td>
                      <td className="px-3 py-2 font-medium text-right">{money(g.valor)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => editar(g)}>
                            <Pencil size={14} /> Editar
                          </Button>
                          <Button variant="ghost" onClick={() => quitar(g.id)}>
                            <Trash2 size={14} /> Quitar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Sin resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Modales */}
      <GastoModal
        open={open}
        setOpen={setOpen}
        draft={draft}
        setDraft={setDraft}
        acts={acts}
        execByAct={execByAct}
        onSave={guardar}
      />
      <PresupuestoModal open={openCfg} setOpen={setOpenCfg} acts={acts} setActs={setActs} rows={rows} />
    </DashboardShell>
  );
}

/* ============ Modal de Gasto ============ */
function GastoModal({
  open, setOpen, draft, setDraft, acts, execByAct, onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Gasto | null;
  setDraft: (g: Gasto | null) => void;
  acts: Actividad[];
  execByAct: Record<string, number>;
  onSave: () => void;
}) {
  if (!draft) return null;

  const act = acts.find((a) => a.id === draft.actividadId);
  const ejecutado = execByAct[draft.actividadId] || 0;
  const presupuesto = act?.presupuesto ?? 0;
  const disponible = presupuesto - (ejecutado - (/* si es edición restar su valor original? */ 0)) - draft.valor;
  const pct = presupuesto ? Math.max(0, Math.min(100, Math.round(((ejecutado + draft.valor) / presupuesto) * 100))) : 0;

  const onAdj = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
    setDraft({ ...draft, adjuntos: [...draft.adjuntos, ...arr] });
  };
  const rmAdj = (name: string) =>
    setDraft({ ...draft, adjuntos: draft.adjuntos.filter((a) => a.name !== name) });

  const valid = !!draft.actividadId && !!draft.categoria && !!draft.fecha && draft.valor > 0 && draft.descripcion.trim();

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Gasto — ${act ? `${act.codigo} • ${act.nombre}` : "Actividad"}`}
      wide
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={!valid}><CheckCircle2 size={16} /> Guardar</Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario */}
        <div className="grid grid-cols-1 gap-4 lg:col-span-2 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Actividad</span>
            <Select
              value={draft.actividadId}
              onChange={(e) => setDraft({ ...draft, actividadId: e.target.value })}
            >
              {acts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} • {a.nombre}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Categoría</span>
            <Select
              value={draft.categoria}
              onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
            >
              {(CATS as readonly string[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Fecha</span>
            <Input type="date" value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Valor</span>
            <Input
              type="number"
              min={0}
              value={draft.valor}
              onChange={(e) => setDraft({ ...draft, valor: Number(e.target.value) })}
              placeholder="0"
            />
          </label>

          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-slate-700">Descripción</span>
            <Textarea
              rows={3}
              value={draft.descripcion}
              onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
              placeholder="Detalle del gasto..."
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Proveedor</span>
            <Input
              value={draft.proveedor || ""}
              onChange={(e) => setDraft({ ...draft, proveedor: e.target.value })}
              placeholder="Nombre / NIT"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Método de pago</span>
            <Select
              value={draft.metodo || "Transferencia"}
              onChange={(e) => setDraft({ ...draft, metodo: e.target.value as any })}
            >
              {["Efectivo", "Transferencia", "Cheque", "Otro"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Documento (factura/soporte)</span>
            <Input
              value={draft.documento || ""}
              onChange={(e) => setDraft({ ...draft, documento: e.target.value })}
              placeholder="FV-0000 / OC-0000"
            />
          </label>

          <div className="md:col-span-2 rounded border border-[var(--subtle)] bg-white p-3">
            <div className="mb-2 text-sm font-semibold">Adjuntos (PDF/otros)</div>
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
                          <Button variant="ghost" onClick={() => rmAdj(a.name)}><Trash2 size={14} /> Quitar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de actividad */}
        <div className="grid gap-3">
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="mb-1 text-sm font-semibold">Resumen de actividad</div>
            <div className="text-xs text-slate-600">Actividad: <b>{act ? `${act.codigo} • ${act.nombre}` : "—"}</b></div>
            <div className="text-xs text-slate-600">Presupuesto: <b>{money(presupuesto)}</b></div>
            <div className="text-xs text-slate-600">Ejecutado + este gasto: <b>{money((execByAct[draft.actividadId] || 0) + draft.valor)}</b></div>
            <div className="text-xs text-slate-600">Disponible estimado: <b>{money(disponible)}</b></div>
            <div className="h-2 mt-2 overflow-hidden rounded bg-slate-100">
              <div className="h-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Modal de Presupuestos ============ */
function PresupuestoModal({
  open, setOpen, acts, setActs, rows,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  acts: Actividad[];
  setActs: (f: Actividad[] | ((p: Actividad[]) => Actividad[])) => void;
  rows: Gasto[];
}) {
  if (!open) return null;

  const execByAct = rows.reduce<Record<string, number>>((m, g) => ((m[g.actividadId] = (m[g.actividadId] || 0) + g.valor), m), {});
  const setAct = (i: number, patch: Partial<Actividad>) => {
    const arr = [...acts];
    arr[i] = { ...arr[i], ...patch };
    setActs(arr);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Definir/editar presupuestos por actividad"
      actions={<Button onClick={() => setOpen(false)}>Guardar cambios</Button>}
      wide
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--subtle)] text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Actividad</th>
              <th className="px-3 py-2 text-right">Presupuesto</th>
              <th className="px-3 py-2 text-right">Ejecutado</th>
              <th className="px-3 py-2 text-right">Disponible</th>
              <th className="px-3 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {acts.map((a, i) => {
              const exec = execByAct[a.id] || 0;
              const disp = a.presupuesto - exec;
              return (
                <tr key={a.id} className="border-b border-[var(--subtle)]/70">
                  <td className="px-3 py-2">{a.codigo}</td>
                  <td className="px-3 py-2">{a.nombre}</td>
                  <td className="px-3 py-2 text-right">
                    <Input
                      type="number"
                      min={0}
                      value={a.presupuesto}
                      onChange={(e) => setAct(i, { presupuesto: Number(e.target.value) })}
                      className="text-right w-36"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">{money(exec)}</td>
                  <td className="px-3 py-2 text-right">{money(disp)}</td>
                  <td className="px-3 py-2">
                    <Select value={a.estado} onChange={(e) => setAct(i, { estado: e.target.value as EstadoAct })}>
                      {(["Abierta", "Cerrada"] as const).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
  

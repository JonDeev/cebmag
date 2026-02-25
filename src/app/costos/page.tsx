"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Wallet,
  Plus,
  FileDown,
  Pencil,
  Trash2,
  CheckCircle2,
  Building2,
  Calendar,
  X,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getActividades,
  patchActividades,
  getGastos,
  createGasto,
  updateGasto,
  deleteGasto,
  createActividad,
  deleteActividad,
  type Actividad,
  type Gasto,
} from "@/lib/costos.api";

import ConfirmModal from "@/components/ui/ConfirmModal";

/* ============ Helpers UI ============ */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
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
function Section({
  title,
  icon,
  actions,
  children,
}: {
  title: string;
  icon: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
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

function Modal({
  open,
  onClose,
  title,
  actions,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  actions?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={[
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          wide ? "w-[98vw] max-w-[1400px]" : "w-[96vw] max-w-[980px]",
          "max-h-[92vh] overflow-hidden rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl",
          "flex flex-col",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3 shrink-0">
          <h4 className="text-sm font-semibold">{title}</h4>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        {/* contenido con scroll vertical SOLO si se necesita */}
        <div className="p-4 overflow-y-auto grow">{children}</div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3 shrink-0">
          {actions}
        </div>
      </div>
    </div>
  );
}

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const CATS = ["Personal", "Honorarios", "Transporte", "Insumos", "Alquiler", "Papelería", "Logística", "Otros"] as const;

const hoy = new Date().toISOString().slice(0, 10);

/* ============ Página ============ */
export default function CostosPage() {
  const title = "Costos y gastos por actividad";

  const [acts, setActs] = useState<Actividad[]>([]);
  const [rows, setRows] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [actId, setActId] = useState<string>("");
  const [cat, setCat] = useState<string>("");
  const [d1, setD1] = useState<string>("");
  const [d2, setD2] = useState<string>("");

  // modal gasto
  const [openGasto, setOpenGasto] = useState(false);
  const [draft, setDraft] = useState<(Omit<Gasto, "id"> & { id?: number }) | null>(null);
  const [originalValor, setOriginalValor] = useState<number>(0);

  // modal actividades
  const [openActs, setOpenActs] = useState(false);

  const execByAct = useMemo(() => {
    const m: Record<number, number> = {};
    rows.forEach((g) => (m[g.actividadId] = (m[g.actividadId] || 0) + g.valor));
    return m;
  }, [rows]);

  const kpis = useMemo(() => {
    const totalPres = acts.reduce((a, b) => a + (b.presupuesto || 0), 0);
    const totalExec = rows.reduce((a, b) => a + (b.valor || 0), 0);
    const disp = totalPres - totalExec;
    const pct = totalPres ? Math.round((totalExec / totalPres) * 100) : 0;
    return { totalPres, totalExec, disp, pct };
  }, [acts, rows]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const hitQ =
        !t ||
        [r.descripcion, r.proveedor || "", r.documento || "", r.categoria].join(" ").toLowerCase().includes(t);
      const hitAct = !actId || String(r.actividadId) === actId;
      const hitCat = !cat || r.categoria === cat;
      const hitD1 = !d1 || r.fecha >= d1;
      const hitD2 = !d2 || r.fecha <= d2;
      return hitQ && hitAct && hitCat && hitD1 && hitD2;
    });
  }, [rows, q, actId, cat, d1, d2]);

  const reloadAll = async () => {
    setLoading(true);
    try {
      const [a, g] = await Promise.all([
        getActividades(),
        getGastos({ q: "", actividadId: "", categoria: "", d1: "", d2: "", page: 1, pageSize: 500 }),
      ]);
      setActs(a);
      setRows(g.items || []);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar costos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nueva = () => {
    const firstAct = acts[0]?.id;
    if (!firstAct) {
      toast.error("No hay actividades. Crea una actividad primero.");
      setOpenActs(true);
      return;
    }

    setOriginalValor(0);
    setDraft({
      fecha: hoy,
      actividadId: Number(actId || firstAct),
      categoria: "Insumos",
      descripcion: "",
      proveedor: "",
      metodo: "Transferencia",
      documento: "",
      valor: 0,
      adjuntos: [],
    });
    setOpenGasto(true);
  };

  const editar = (g: Gasto) => {
    setOriginalValor(g.valor);
    setDraft({ ...g });
    setOpenGasto(true);
  };

  const guardar = async () => {
    if (!draft) return;

    const payload: any = {
      fecha: draft.fecha,
      actividadId: Number(draft.actividadId),
      categoria: draft.categoria,
      descripcion: String(draft.descripcion ?? ""),
      proveedor: draft.proveedor ?? "",
      metodo: draft.metodo ?? "",
      documento: draft.documento ?? "",
      valor: Number(draft.valor ?? 0),
      adjuntos: Array.isArray(draft.adjuntos) ? draft.adjuntos : [],
    };

    if (!payload.actividadId) return toast.error("Actividad requerida");
    if (!payload.descripcion?.trim()) return toast.error("Descripción requerida");
    if (!payload.valor || payload.valor <= 0) return toast.error("Valor inválido");

    const t = toast.loading(draft.id ? "Actualizando..." : "Guardando...");
    try {
      const saved =
        draft.id && draft.id > 0 ? await updateGasto(draft.id, payload) : await createGasto(payload);

      if (!saved) {
        toast.dismiss(t);
        return;
      }

      toast.success("Guardado ✅", { id: t });
      setOpenGasto(false);
      await reloadAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Error guardando", { id: t });
    }
  };

  const quitar = async (id: number) => {
    const t = toast.loading("Eliminando...");
    try {
      const ok = await deleteGasto(id);
      if (!ok) {
        toast.dismiss(t);
        return;
      }
      toast.success("Eliminado ✅", { id: t });
      await reloadAll();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar", { id: t });
    }
  };

  const exportCSV = () => {
    const head = ["fecha", "actividad", "categoria", "descripcion", "proveedor", "metodo", "documento", "valor"];
    const lines = list.map((r) => {
      const act = acts.find((a) => a.id === r.actividadId);
      return [
        r.fecha,
        `${act?.codigo ?? ""} ${act?.nombre ?? ""}`.trim(),
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

  const cerrarAct = async (id: number) => {
    const t = toast.loading("Cerrando actividad...");
    try {
      await patchActividades([{ id, estado: "Cerrada" as any }]);
      toast.success("Actividad cerrada ✅", { id: t });
      await reloadAll();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cerrar", { id: t });
    }
  };

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

        {/* Actividades */}
        <Section
          title="Actividades (presupuesto y estado)"
          icon={<BarChart3 size={18} />}
          actions={
            <Button variant="outline" type="button" onClick={() => setOpenActs(true)}>
              <Plus size={16} /> Gestionar actividades
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {acts.map((a) => {
              const gasto = execByAct[a.id] || 0;
              const disp = (a.presupuesto || 0) - gasto;
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
                        type="button"
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

            {!loading && acts.length === 0 && (
              <div className="rounded border border-[var(--subtle)] bg-white p-4 text-sm text-slate-600">
                Aún no hay actividades. Crea tus actividades con el botón <b>Gestionar actividades</b>.
              </div>
            )}
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
                <Select value={actId} onChange={(e) => setActId(e.target.value)} className="w-64">
                  <option value="">Actividad: Todas</option>
                  {acts.map((a) => (
                    <option key={a.id} value={String(a.id)}>
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

              <Button variant="outline" type="button" onClick={exportCSV}>
                <FileDown size={16} /> Exportar
              </Button>
              <Button type="button" onClick={nueva}>
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
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Cargando…
                    </td>
                  </tr>
                )}

                {!loading &&
                  list.map((g) => {
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
                            <Button variant="outline" type="button" onClick={() => editar(g)}>
                              <Pencil size={14} /> Editar
                            </Button>
                            <Button variant="ghost" type="button" onClick={() => quitar(g.id)}>
                              <Trash2 size={14} /> Quitar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && list.length === 0 && (
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

      {/* Modal Gasto */}
      <GastoModal
        open={openGasto}
        setOpen={setOpenGasto}
        draft={draft}
        setDraft={setDraft}
        acts={acts}
        execByAct={execByAct}
        originalValor={originalValor}
        onSave={guardar}
      />

      {/* Modal Actividades */}
      <ActividadesModal
        open={openActs}
        setOpen={setOpenActs}
        acts={acts}
        onSaved={reloadAll}
      />
    </DashboardShell>
  );
}

/* ============ Modal de Gasto ============ */
function GastoModal({
  open,
  setOpen,
  draft,
  setDraft,
  acts,
  execByAct,
  originalValor,
  onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: (Omit<Gasto, "id"> & { id?: number }) | null;
  setDraft: (g: any) => void;
  acts: Actividad[];
  execByAct: Record<number, number>;
  originalValor: number;
  onSave: () => void;
}) {
  if (!draft) return null;

  const act = acts.find((a) => a.id === Number(draft.actividadId));
  const ejecutado = execByAct[Number(draft.actividadId)] || 0;
  const presupuesto = act?.presupuesto ?? 0;

  const ejecutadoSinEste = Math.max(0, ejecutado - (draft.id ? originalValor : 0));
  const disp = presupuesto - (ejecutadoSinEste + Number(draft.valor || 0));
  const pct = presupuesto
    ? Math.max(0, Math.min(100, Math.round(((ejecutadoSinEste + Number(draft.valor || 0)) / presupuesto) * 100)))
    : 0;

  const onAdj = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
    setDraft({ ...draft, adjuntos: [...(draft.adjuntos || []), ...arr] });
  };

  const rmAdj = (name: string) =>
    setDraft({ ...draft, adjuntos: (draft.adjuntos || []).filter((a: any) => a.name !== name) });

  const valid =
    !!draft.actividadId &&
    !!draft.categoria &&
    !!draft.fecha &&
    Number(draft.valor) > 0 &&
    String(draft.descripcion || "").trim();

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Gasto — ${act ? `${act.codigo} • ${act.nombre}` : "Actividad"}`}
      wide
      actions={
        <>
          <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} disabled={!valid}>
            <CheckCircle2 size={16} /> Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 lg:col-span-2 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Actividad</span>
            <Select value={String(draft.actividadId)} onChange={(e) => setDraft({ ...draft, actividadId: Number(e.target.value) })}>
              {acts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.codigo} • {a.nombre}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Categoría</span>
            <Select value={String(draft.categoria)} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}>
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Fecha</span>
            <Input type="date" value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Valor</span>
            <Input type="number" min={0} value={Number(draft.valor || 0)} onChange={(e) => setDraft({ ...draft, valor: Number(e.target.value) })} />
          </label>

          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-slate-700">Descripción</span>
            <Textarea rows={3} value={String(draft.descripcion || "")} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Proveedor</span>
            <Input value={String(draft.proveedor || "")} onChange={(e) => setDraft({ ...draft, proveedor: e.target.value })} />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Método de pago</span>
            <Select value={String(draft.metodo || "Transferencia")} onChange={(e) => setDraft({ ...draft, metodo: e.target.value })}>
              {["Efectivo", "Transferencia", "Cheque", "Otro"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Documento (factura/soporte)</span>
            <Input value={String(draft.documento || "")} onChange={(e) => setDraft({ ...draft, documento: e.target.value })} />
          </label>

          <div className="md:col-span-2 rounded border border-[var(--subtle)] bg-white p-3">
            <div className="mb-2 text-sm font-semibold">Adjuntos (PDF/otros)</div>
            <input type="file" multiple onChange={(e) => onAdj(e.target.files)} />
            {!!draft.adjuntos?.length && (
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
                    {draft.adjuntos.map((a: any) => (
                      <tr key={a.name} className="border-b border-[var(--subtle)]/60">
                        <td className="px-2 py-2">{a.name}</td>
                        <td className="px-2 py-2">{(a.size / 1024).toFixed(1)} KB</td>
                        <td className="px-2 py-2">
                          <Button variant="ghost" type="button" onClick={() => rmAdj(a.name)}>
                            <Trash2 size={14} /> Quitar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded border border-[var(--subtle)] bg-white p-3">
            <div className="mb-1 text-sm font-semibold">Resumen de actividad</div>
            <div className="text-xs text-slate-600">
              Actividad: <b>{act ? `${act.codigo} • ${act.nombre}` : "—"}</b>
            </div>
            <div className="text-xs text-slate-600">
              Presupuesto: <b>{money(presupuesto)}</b>
            </div>
            <div className="text-xs text-slate-600">
              Ejecutado (estimado): <b>{money(ejecutadoSinEste + Number(draft.valor || 0))}</b>
            </div>
            <div className="text-xs text-slate-600">
              Disponible estimado: <b>{money(disp)}</b>
            </div>
            <div className="h-2 mt-2 overflow-hidden rounded bg-slate-100">
              <div className="h-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Modal Actividades (crear / editar / eliminar) ============ */
function ActividadesModal({
  open,
  setOpen,
  acts,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  acts: Actividad[];
  onSaved?: () => Promise<void> | void;
}) {
  const [local, setLocal] = useState<Actividad[]>([]);
  const [newCodigo, setNewCodigo] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newPres, setNewPres] = useState<number>(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Actividad | null>(null);

  useEffect(() => {
    if (open) setLocal(JSON.parse(JSON.stringify(acts ?? [])));
  }, [acts, open]);

  const setAct = (i: number, patch: Partial<Actividad>) => {
    setLocal((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], ...patch };
      return arr;
    });
  };

  const save = async () => {
    const t = toast.loading("Guardando cambios...");
    try {
      const items = local.map((a) => ({
        id: a.id,
        presupuesto: Number(a.presupuesto || 0),
        estado: a.estado,
        nombre: a.nombre,
      }));
      await patchActividades(items as any);
      toast.success("Actividades guardadas ✅", { id: t });
      await onSaved?.();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error guardando actividades", { id: t });
    }
  };

  const crear = async () => {
    const codigo = newCodigo.trim().toUpperCase();
    const nombre = newNombre.trim();
    if (!codigo) return toast.error("Código requerido");
    if (!nombre) return toast.error("Nombre requerido");

    const t = toast.loading("Creando actividad...");
    try {
      const created = await createActividad({
        codigo,
        nombre,
        presupuesto: Number(newPres || 0),
        estado: "Abierta",
      });

      if (!created || !created.id) {
        toast.error("No se pudo crear", { id: t });
        return;
      }

      toast.success("Actividad creada ✅", { id: t });
      setLocal((prev) => [...prev, created].sort((a, b) => a.codigo.localeCompare(b.codigo)));

      setNewCodigo("");
      setNewNombre("");
      setNewPres(0);

      await onSaved?.();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear", { id: t });
    }
  };

  const askDelete = (a: Actividad) => {
    setToDelete(a);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setConfirmLoading(true);
    const t = toast.loading("Eliminando...");

    try {
      const res = await deleteActividad(toDelete.id);

      // ✅ soporte robusto: boolean / {ok:true} / {success:true}
      const ok =
        res === true ||
        (typeof res === "object" && (res?.ok === true || res?.success === true));

      if (!ok) {
        // si tu deleteActividad devuelve false sin tirar error
        toast.dismiss(t);
        toast.error("No se pudo eliminar la actividad.");
        return;
      }

      toast.success("Actividad eliminada ✅", { id: t });

      setLocal((prev) => prev.filter((x) => x.id !== toDelete.id));
      await onSaved?.();

      setConfirmOpen(false);
      setToDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar", { id: t });
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Actividades (crear / editar / eliminar)"
        wide
        actions={
          <>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save}>
              Guardar cambios
            </Button>
          </>
        }
      >
        {/* Crear */}
        <div className="mb-4 rounded border border-[var(--subtle)] bg-white p-3">
          <div className="mb-2 text-sm font-semibold">Crear actividad</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr_220px_160px]">
            <Input placeholder="Código (A1)" value={newCodigo} onChange={(e) => setNewCodigo(e.target.value)} />
            <Input placeholder="Nombre" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} />
            <Input type="number" min={0} placeholder="Presupuesto" value={newPres} onChange={(e) => setNewPres(Number(e.target.value || 0))} />
            <Button type="button" onClick={crear} className="justify-center">
              <Plus size={16} /> Crear
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            * Si una actividad ya tiene gastos asociados, la API no permitirá eliminarla.
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="border-b border-[var(--subtle)] text-slate-500">
              <tr>
                <th className="w-[110px] px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="w-[220px] px-3 py-2 text-right">Presupuesto</th>
                <th className="w-[180px] px-3 py-2 text-left">Estado</th>
                <th className="w-[160px] px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {local.map((a, i) => (
                <tr key={a.id} className="border-b border-[var(--subtle)]/70">
                  <td className="px-3 py-2">{a.codigo}</td>
                  <td className="px-3 py-2">
                    <Input value={a.nombre} onChange={(e) => setAct(i, { nombre: e.target.value })} className="w-full" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Input
                      type="number"
                      min={0}
                      value={a.presupuesto}
                      onChange={(e) => setAct(i, { presupuesto: Number(e.target.value || 0) })}
                      className="w-full text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={a.estado} onChange={(e) => setAct(i, { estado: e.target.value as any })} className="w-full">
                      <option value="Abierta">Abierta</option>
                      <option value="Cerrada">Cerrada</option>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => askDelete(a)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={14} /> Eliminar
                    </Button>
                  </td>
                </tr>
              ))}

              {local.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay actividades.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        loading={confirmLoading}
        title="Eliminar actividad"
        message={toDelete ? `¿Eliminar la actividad ${toDelete.codigo} • ${toDelete.nombre}?` : "¿Eliminar actividad?"}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        tone="danger"
        onClose={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
            setToDelete(null);
          }
        }}
        onConfirm={doDelete}
      />
    </>
  );
}
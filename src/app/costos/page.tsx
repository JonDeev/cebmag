"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import { Wallet, Plus, FileDown, Pencil, Trash2, CheckCircle2, Building2, Calendar, X, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

import {
  getActividades,
  patchActividades,
  getGastos,
  createGasto,
  updateGasto,
  deleteGasto,
  type Actividad,
  type Gasto,
} from "@/lib/costos.api";

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
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3">{actions}</div>
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
  const [actId, setActId] = useState<string>(""); // string para el select
  const [cat, setCat] = useState<string>("");
  const [d1, setD1] = useState<string>("");
  const [d2, setD2] = useState<string>("");

  // modal gasto
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<(Omit<Gasto, "id"> & { id?: number }) | null>(null);
  const [originalValor, setOriginalValor] = useState<number>(0);

  // modal presupuestos
  const [openCfg, setOpenCfg] = useState(false);

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
    return rows.filter((r) => {
      const hitQ =
        !q ||
        [r.descripcion, r.proveedor || "", r.documento || "", r.categoria]
          .join(" ")
          .toLowerCase()
          .includes(q.trim().toLowerCase());
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
  }, []);

  /* ---- Acciones ---- */
  const nueva = () => {
    const firstAct = acts[0]?.id;
    if (!firstAct) {
      toast.error("No hay actividades cargadas.");
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
    setOpen(true);
  };

  const editar = (g: Gasto) => {
    setOriginalValor(g.valor);
    setDraft({ ...g });
    setOpen(true);
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

    let saved: any = null;

    if (draft.id && draft.id > 0) {
      saved = await updateGasto(draft.id, payload);
    } else {
      saved = await createGasto(payload);
    }

    if (!saved) return;

    setOpen(false);
    await reloadAll();
  };

  const quitar = async (id: number) => {
    const ok = await deleteGasto(id);
    if (!ok) return;
    await reloadAll();
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
    try {
      await patchActividades([{ id, estado: "Cerrada" as any }]);
      toast.success("Actividad cerrada ✅");
      await reloadAll();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cerrar");
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
            <Button variant="outline" onClick={() => setOpenCfg(true)}>
              <Pencil size={16} /> Definir/editar presupuestos
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
                    <option key={a.id} value={String(a.id)}>
                      {a.codigo} • {a.nombre}
                    </option>
                  ))}
                </Select>
                <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
                  <option value="">Categoría: Todas</option>
                  {CATS.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">Cargando…</td>
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

                {!loading && list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">Sin resultados.</td>
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
        originalValor={originalValor}
        onSave={guardar}
      />

      <PresupuestoModal
        open={openCfg}
        setOpen={setOpenCfg}
        acts={acts}
        setActs={setActs}
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

  // disponible estimado: ejecutado - original (si edición) + nuevo valor
  const ejecutadoSinEste = Math.max(0, ejecutado - (draft.id ? originalValor : 0));
  const disp = presupuesto - (ejecutadoSinEste + Number(draft.valor || 0));
  const pct = presupuesto ? Math.max(0, Math.min(100, Math.round(((ejecutadoSinEste + Number(draft.valor || 0)) / presupuesto) * 100))) : 0;

  const onAdj = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
    setDraft({ ...draft, adjuntos: [...(draft.adjuntos || []), ...arr] });
  };
  const rmAdj = (name: string) => setDraft({ ...draft, adjuntos: (draft.adjuntos || []).filter((a: any) => a.name !== name) });

  const valid = !!draft.actividadId && !!draft.categoria && !!draft.fecha && Number(draft.valor) > 0 && String(draft.descripcion || "").trim();

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Gasto — ${act ? `${act.codigo} • ${act.nombre}` : "Actividad"}`}
      wide
      actions={
        <>
          <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="button" onClick={onSave} disabled={!valid}><CheckCircle2 size={16} /> Guardar</Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 lg:col-span-2 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Actividad</span>
            <Select
              value={String(draft.actividadId)}
              onChange={(e) => setDraft({ ...draft, actividadId: Number(e.target.value) })}
            >
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
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
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
              {["Efectivo", "Transferencia", "Cheque", "Otro"].map((m) => <option key={m} value={m}>{m}</option>)}
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
                          <Button variant="ghost" type="button" onClick={() => rmAdj(a.name)}><Trash2 size={14} /> Quitar</Button>
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
            <div className="text-xs text-slate-600">Actividad: <b>{act ? `${act.codigo} • ${act.nombre}` : "—"}</b></div>
            <div className="text-xs text-slate-600">Presupuesto: <b>{money(presupuesto)}</b></div>
            <div className="text-xs text-slate-600">Ejecutado (estimado): <b>{money(ejecutadoSinEste + Number(draft.valor || 0))}</b></div>
            <div className="text-xs text-slate-600">Disponible estimado: <b>{money(disp)}</b></div>
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
  open, setOpen, acts, setActs,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  acts: Actividad[];
  setActs: (f: any) => void;
}) {
  if (!open) return null;

  const [local, setLocal] = useState<Actividad[]>(JSON.parse(JSON.stringify(acts)));

  useEffect(() => {
    setLocal(JSON.parse(JSON.stringify(acts)));
  }, [acts]);

  const setAct = (i: number, patch: Partial<Actividad>) => {
    const arr = [...local];
    arr[i] = { ...arr[i], ...patch };
    setLocal(arr);
  };

  const save = async () => {
    try {
      const items = local.map((a) => ({ id: a.id, presupuesto: a.presupuesto, estado: a.estado, nombre: a.nombre }));
      await patchActividades(items as any);
      setActs(local);
      toast.success("Presupuestos guardados ✅");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error guardando presupuestos");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Definir/editar presupuestos por actividad"
      actions={<Button type="button" onClick={save}>Guardar cambios</Button>}
      wide
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--subtle)] text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Actividad</th>
              <th className="px-3 py-2 text-right">Presupuesto</th>
              <th className="px-3 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {local.map((a, i) => (
              <tr key={a.id} className="border-b border-[var(--subtle)]/70">
                <td className="px-3 py-2">{a.codigo}</td>
                <td className="px-3 py-2">
                  <Input value={a.nombre} onChange={(e) => setAct(i, { nombre: e.target.value })} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    type="number"
                    min={0}
                    value={a.presupuesto}
                    onChange={(e) => setAct(i, { presupuesto: Number(e.target.value) })}
                    className="text-right w-36"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select value={a.estado} onChange={(e) => setAct(i, { estado: e.target.value as any })}>
                    <option value="Abierta">Abierta</option>
                    <option value="Cerrada">Cerrada</option>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
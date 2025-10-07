"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus, ClipboardList, Eye, BarChart3, X, Trash2, Check, Pencil, Save, Play, User, ChevronUp, ChevronDown,
} from "lucide-react";

/* ================= Helpers UI ================= */
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
function Section({ title, icon, children, actions }: { title: string; icon: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
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
  children,
  actions,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`absolute left-1/2 top-1/2 ${wide ? "w-[min(980px,96vw)]" : "w-[min(640px,92vw)]"} -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl`}>
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

/* ================= Tipos ================= */
type Estado = "Borrador" | "Activa" | "Inactiva";
type TipoPregunta = "likert" | "si_no" | "opciones" | "texto";
type Pregunta = {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  opciones?: string[]; // para "opciones"
};
type Encuesta = {
  id: string;
  titulo: string;
  servicio: string; // eje/servicio evaluado
  estado: Estado;
  descripcion?: string;
  creada: string; // ISO
  preguntas: Pregunta[];
  respuestas: Respuesta[];
};
type Respuesta = {
  id: string;
  encuestaId: string;
  fecha: string; // ISO
  respondente?: { doc?: string; nombre?: string }; // opcional
  // valor por pregunta:
  // - likert: number 1..5
  // - si_no: "SI" | "NO"
  // - opciones: string (opción)
  // - texto: string
  valores: Record<string, number | "SI" | "NO" | string>;
};

/* ================= Mock inicial ================= */
const HOY = new Date().toISOString().slice(0, 10);
const E1: Encuesta = {
  id: crypto.randomUUID(),
  titulo: "Satisfacción - Atención Medicina General",
  servicio: "Medicina General",
  estado: "Activa",
  descripcion: "Evalúa la oportunidad, trato y calidad del servicio recibido.",
  creada: HOY,
  preguntas: [
    { id: "p1", texto: "¿Qué tan satisfecho está con la oportunidad de la atención?", tipo: "likert" },
    { id: "p2", texto: "¿El profesional fue respetuoso y claro en sus explicaciones?", tipo: "likert" },
    { id: "p3", texto: "¿Recomendaría el servicio a otra persona?", tipo: "si_no" },
    { id: "p4", texto: "Dejar comentario adicional (opcional)", tipo: "texto" },
  ],
  respuestas: [],
};
const START: Encuesta[] = [E1];

/* ================= Utilidades ================= */
const likertLabels = ["Muy insatisfecho", "Insatisfecho", "Neutral", "Satisfecho", "Muy satisfecho"];

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}
function counts<T extends string | number>(arr: T[]): Record<string, number> {
  return arr.reduce((m, v) => ((m[String(v)] = (m[String(v)] || 0) + 1), m), {} as Record<string, number>);
}

/* ================= Página ================= */
export default function EncuestasPage() {
  const title = "Encuestas de satisfacción";
  const [encuestas, setEncuestas] = useState<Encuesta[]>(START);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | Estado>("");
  const [sel, setSel] = useState<string | null>(encuestas[0]?.id ?? null);

  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState<Encuesta | null>(null);

  const [openResp, setOpenResp] = useState(false);
  const [respDraft, setRespDraft] = useState<Respuesta | null>(null);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return encuestas.filter((e) => {
      const okQ =
        !t || [e.titulo, e.servicio, e.descripcion || ""].join(" ").toLowerCase().includes(t);
      const okE = !estado || e.estado === estado;
      return okQ && okE;
    });
  }, [encuestas, q, estado]);

  const encSel = useMemo(() => encuestas.find((e) => e.id === sel) || null, [encuestas, sel]);

  /* ---- CRUD encuesta (UI) ---- */
  const nuevaEncuesta = () => {
    const e: Encuesta = {
      id: crypto.randomUUID(),
      titulo: "Nueva encuesta",
      servicio: "",
      estado: "Borrador",
      descripcion: "",
      creada: HOY,
      preguntas: [],
      respuestas: [],
    };
    setDraft(e);
    setOpenEdit(true);
  };
  const editarEncuesta = (e: Encuesta) => {
    setDraft(JSON.parse(JSON.stringify(e)));
    setOpenEdit(true);
  };
  const guardarEncuesta = () => {
    if (!draft) return;
    setEncuestas((prev) => {
      const i = prev.findIndex((x) => x.id === draft.id);
      const next = i === -1 ? [draft, ...prev] : prev.map((x) => (x.id === draft.id ? draft : x));
      // si guardamos y no hay selección, selecciona esta
      if (!sel) setSel(draft.id);
      return next;
    });
    setOpenEdit(false);
  };
  const eliminarEncuesta = (id: string) => {
    if (!confirm("¿Eliminar la encuesta?")) return;
    setEncuestas((prev) => prev.filter((e) => e.id !== id));
    if (sel === id) setSel(null);
  };

  /* ---- Registrar respuesta (UI) ---- */
  const registrarResp = (e: Encuesta) => {
    const r: Respuesta = {
      id: crypto.randomUUID(),
      encuestaId: e.id,
      fecha: HOY,
      respondente: { doc: "", nombre: "" },
      valores: {},
    };
    setRespDraft(r);
    setOpenResp(true);
  };
  const guardarResp = () => {
    if (!respDraft) return;
    setEncuestas((prev) =>
      prev.map((e) => (e.id === respDraft.encuestaId ? { ...e, respuestas: [respDraft, ...e.respuestas] } : e)),
    );
    setOpenResp(false);
  };

  /* ---- Resultados (agregados en cliente) ---- */
  const resultados = useMemo(() => {
    if (!encSel) return null;
    const porPregunta = encSel.preguntas.map((p) => {
      const vals = encSel.respuestas.map((r) => r.valores[p.id]).filter((v) => v !== undefined);
      if (p.tipo === "likert") {
        const ns = vals as number[];
        return { pid: p.id, tipo: p.tipo, avg: avg(ns), total: ns.length, dist: counts(ns) };
      }
      if (p.tipo === "si_no") {
        const ss = vals as ("SI" | "NO")[];
        return { pid: p.id, tipo: p.tipo, total: ss.length, dist: counts(ss) };
      }
      if (p.tipo === "opciones") {
        const ss = vals as string[];
        return { pid: p.id, tipo: p.tipo, total: ss.length, dist: counts(ss) };
      }
      // texto: solo conteo
      return { pid: p.id, tipo: p.tipo, total: vals.length };
    });
    return porPregunta;
  }, [encSel]);

  /* ---- Render ---- */
  return (
    <DashboardShell title={title}>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Listado de encuestas */}
        <div className="lg:col-span-1">
          <Section
            title="Encuestas"
            icon={<ClipboardList size={18} />}
            actions={
              <>
                <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="w-40" />
                <Select value={estado} onChange={(e) => setEstado(e.target.value as Estado | "")}>
                  <option value="">Estado: Todos</option>
                  {(["Borrador", "Activa", "Inactiva"] as Estado[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <Button onClick={nuevaEncuesta}><Plus size={16} /> Nueva</Button>
              </>
            }
          >
            <ul className="divide-y divide-[var(--subtle)]">
              {lista.map((e) => (
                <li key={e.id} className={`px-3 py-3 rounded hover:bg-white ${sel === e.id ? "bg-white" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => setSel(e.id)} className="text-left">
                      <div className="text-sm font-semibold text-slate-800">{e.titulo}</div>
                      <div className="text-xs text-slate-500">{e.servicio || "—"} • {e.estado} • {e.creada}</div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" onClick={() => editarEncuesta(e)} title="Editar"><Pencil size={14} /></Button>
                      <Button variant="ghost" onClick={() => registrarResp(e)} title="Registrar respuesta"><Play size={14} /></Button>
                      <Button variant="ghost" onClick={() => eliminarEncuesta(e.id)} title="Eliminar"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </li>
              ))}
              {lista.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">Sin encuestas.</li>}
            </ul>
          </Section>
        </div>

        {/* Detalle de encuesta seleccionada */}
        <div className="lg:col-span-2">
          {encSel ? (
            <div className="grid gap-6">
              <Section
                title="Diseño"
                icon={<Pencil size={18} />}
                actions={
                  <>
                    <Button variant="outline" onClick={() => editarEncuesta(encSel)}><Pencil size={14} /> Editar</Button>
                    <Button variant="outline" onClick={() => registrarResp(encSel)}><Play size={14} /> Registrar respuesta</Button>
                  </>
                }
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <span className="text-sm text-slate-600">Título</span>
                    <div className="rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm">{encSel.titulo}</div>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-sm text-slate-600">Servicio</span>
                    <div className="rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm">{encSel.servicio || "—"}</div>
                  </div>
                  <div className="grid gap-1 md:col-span-2">
                    <span className="text-sm text-slate-600">Descripción</span>
                    <div className="rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm">{encSel.descripcion || "—"}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Preguntas</div>
                  <ol className="space-y-2">
                    {encSel.preguntas.map((p, idx) => (
                      <li key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">P{idx + 1}. {p.texto}</div>
                          <span className="text-xs text-slate-500">{p.tipo.toUpperCase()}</span>
                        </div>
                        {p.tipo === "opciones" && p.opciones && (
                          <div className="mt-2 text-xs text-slate-600">Opciones: {p.opciones.join(", ")}</div>
                        )}
                      </li>
                    ))}
                    {encSel.preguntas.length === 0 && <li className="text-sm text-slate-500">No hay preguntas.</li>}
                  </ol>
                </div>
              </Section>

              <Section title="Resultados" icon={<BarChart3 size={18} />}>
                {(!resultados || encSel.respuestas.length === 0) && (
                  <p className="text-sm text-slate-500">Aún no hay respuestas registradas.</p>
                )}
                {resultados && encSel.respuestas.length > 0 && (
                  <div className="grid gap-4">
                    {encSel.preguntas.map((p, i) => {
                      const r = resultados[i] as any;
                      if (p.tipo === "likert") {
                        // barra proporcional simple
                        const dist = r?.dist || {};
                        const total = r?.total || 0;
                        const avgVal = r?.avg || 0;
                        return (
                          <div key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                            <div className="text-sm font-medium mb-2">{p.texto}</div>
                            <div className="h-2 w-full bg-slate-100 rounded overflow-hidden flex">
                              {Array.from({ length: 5 }, (_, k) => k + 1).map((k) => {
                                const w = total ? Math.round(((dist[String(k)] || 0) / total) * 100) : 0;
                                return <div key={k} style={{ width: `${Math.max(w, 1)}%` }} className="h-full" />;
                              })}
                            </div>
                            <div className="mt-2 text-xs text-slate-600 flex items-center gap-3">
                              <span>Promedio: <b>{avgVal || "—"}</b> / 5</span>
                              <span>Respuestas: {total}</span>
                            </div>
                          </div>
                        );
                      }
                      if (p.tipo === "si_no") {
                        const dist = r?.dist || {};
                        const total = r?.total || 0;
                        return (
                          <div key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                            <div className="text-sm font-medium mb-2">{p.texto}</div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="inline-flex items-center gap-1"><Check size={14} className="text-emerald-600" /> SI: <b>{dist["SI"] || 0}</b></span>
                              <span className="inline-flex items-center gap-1"><X size={14} className="text-rose-600" /> NO: <b>{dist["NO"] || 0}</b></span>
                              <span className="text-slate-500">Total: {total}</span>
                            </div>
                          </div>
                        );
                      }
                      if (p.tipo === "opciones") {
                        const dist = r?.dist || {};
                        const total = r?.total || 0;
                        const opciones = p.opciones || [];
                        return (
                          <div key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                            <div className="text-sm font-medium mb-2">{p.texto}</div>
                            <ul className="text-sm space-y-1">
                              {opciones.map((op) => {
                                const c = dist[op] || 0;
                                const pct = total ? Math.round((c / total) * 100) : 0;
                                return (
                                  <li key={op} className="flex items-center gap-2">
                                    <span className="w-40">{op}</span>
                                    <div className="h-2 flex-1 bg-slate-100 rounded overflow-hidden">
                                      <div className="h-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-16 text-right text-slate-600">{c} ({pct}%)</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      }
                      // texto: solo conteo
                      const total = r?.total || 0;
                      return (
                        <div key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                          <div className="text-sm font-medium mb-1">{p.texto}</div>
                          <div className="text-xs text-slate-600">Respuestas abiertas: <b>{total}</b></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </div>
          ) : (
            <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)] p-6 text-sm text-slate-600">
              Selecciona una encuesta del listado o crea una nueva.
            </div>
          )}
        </div>
      </div>

      {/* Modal crear/editar encuesta */}
      <EncuestaModal
        open={openEdit}
        setOpen={setOpenEdit}
        draft={draft}
        setDraft={setDraft}
        onSave={guardarEncuesta}
      />

      {/* Modal registrar respuesta */}
      <RespuestaModal
        open={openResp}
        setOpen={setOpenResp}
        encuesta={encSel}
        draft={respDraft}
        setDraft={setRespDraft}
        onSave={guardarResp}
      />
    </DashboardShell>
  );
}

/* ================= Modal de Encuesta (diseño) ================= */
function EncuestaModal({
  open, setOpen, draft, setDraft, onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Encuesta | null;
  setDraft: (e: Encuesta | null) => void;
  onSave: () => void;
}) {
  if (!draft) return null;

  const addPregunta = (tipo: TipoPregunta) => {
    const p: Pregunta = { id: crypto.randomUUID(), texto: "Nueva pregunta", tipo };
    if (tipo === "opciones") p.opciones = ["Opción 1", "Opción 2"];
    setDraft({ ...draft, preguntas: [...draft.preguntas, p] });
  };
  const rmPregunta = (id: string) =>
    setDraft({ ...draft, preguntas: draft.preguntas.filter((p) => p.id !== id) });

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...draft.preguntas];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    const tmp = arr[idx];
    arr[idx] = arr[j];
    arr[j] = tmp;
    setDraft({ ...draft, preguntas: arr });
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Diseño de encuesta — ${draft.titulo || "Sin título"}`}
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSave}><Save size={16} /> Guardar</Button>
        </>
      }
      wide
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Título</label>
            <Input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Servicio</label>
            <Input value={draft.servicio} onChange={(e) => setDraft({ ...draft, servicio: e.target.value })} placeholder="Ej: Medicina, Enfermería..." />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Estado</label>
            <Select value={draft.estado} onChange={(e) => setDraft({ ...draft, estado: e.target.value as Estado })}>
              {(["Borrador", "Activa", "Inactiva"] as Estado[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Descripción</label>
            <Textarea value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} rows={4} />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">Agregar pregunta</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => addPregunta("likert")}>Likert (1–5)</Button>
              <Button variant="outline" onClick={() => addPregunta("si_no")}>Sí/No</Button>
              <Button variant="outline" onClick={() => addPregunta("opciones")}>Opción única</Button>
              <Button variant="outline" onClick={() => addPregunta("texto")}>Respuesta abierta</Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-semibold mb-2">Preguntas</div>
          <ol className="space-y-2">
            {draft.preguntas.map((p, idx) => (
              <li key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <Input
                      value={p.texto}
                      onChange={(e) => {
                        const arr = [...draft.preguntas];
                        arr[idx] = { ...p, texto: e.target.value };
                        setDraft({ ...draft, preguntas: arr });
                      }}
                    />
                    <div className="mt-1 text-xs text-slate-500">Tipo: {p.tipo.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" onClick={() => move(idx, -1)} title="Subir"><ChevronUp size={16} /></Button>
                    <Button variant="ghost" onClick={() => move(idx, +1)} title="Bajar"><ChevronDown size={16} /></Button>
                    <Button variant="ghost" onClick={() => rmPregunta(p.id)} title="Eliminar"><Trash2 size={16} /></Button>
                  </div>
                </div>

                {p.tipo === "opciones" && (
                  <OpcionesEditor
                    opciones={p.opciones || []}
                    onChange={(ops) => {
                      const arr = [...draft.preguntas];
                      arr[idx] = { ...p, opciones: ops };
                      setDraft({ ...draft, preguntas: arr });
                    }}
                  />
                )}

                {p.tipo === "likert" && (
                  <div className="mt-2 text-xs text-slate-500">
                    Escala: 1={likertLabels[0]} … 5={likertLabels[4]}
                  </div>
                )}
              </li>
            ))}
            {draft.preguntas.length === 0 && (
              <li className="text-sm text-slate-500">Aún no hay preguntas. Usa “Agregar pregunta”.</li>
            )}
          </ol>
        </div>
      </div>
    </Modal>
  );
}

function OpcionesEditor({ opciones, onChange }: { opciones: string[]; onChange: (ops: string[]) => void }) {
  const set = (i: number, v: string) => onChange(opciones.map((o, idx) => (idx === i ? v : o)));
  const add = () => onChange([...opciones, `Opción ${opciones.length + 1}`]);
  const rm = (i: number) => onChange(opciones.filter((_, idx) => idx !== i));
  return (
    <div className="mt-3 grid gap-2">
      <div className="text-sm font-medium">Opciones</div>
      {opciones.map((op, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={op} onChange={(e) => set(i, e.target.value)} />
          <Button variant="ghost" onClick={() => rm(i)} title="Quitar"><Trash2 size={16} /></Button>
        </div>
      ))}
      <Button variant="outline" onClick={add}><Plus size={16} /> Agregar opción</Button>
    </div>
  );
}

/* ================= Modal de Respuesta ================= */
function RespuestaModal({
  open, setOpen, encuesta, draft, setDraft, onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  encuesta: Encuesta | null;
  draft: Respuesta | null;
  setDraft: (r: Respuesta | null) => void;
  onSave: () => void;
}) {
  if (!encuesta || !draft) return null;

  const setVal = (pid: string, val: number | "SI" | "NO" | string) =>
    setDraft({ ...draft, valores: { ...draft.valores, [pid]: val } });

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Registrar respuesta — ${encuesta.titulo}`}
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSave}><Save size={16} /> Guardar</Button>
        </>
      }
      wide
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 grid gap-3">
          <div className="text-sm font-semibold">Respondente (opcional)</div>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Tipo de Documento</span>
              <Select name="tipo_doc" defaultValue="CC">
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="RC">Registro Civil (RC)</option>
                <option value="PA">Pasaporte (PA)</option>
              </Select>
            <span className="text-slate-600">Documento</span>
            <Input value={draft.respondente?.doc || ""} onChange={(e) => setDraft({ ...draft, respondente: { ...(draft.respondente || {}), doc: e.target.value } })} placeholder="123456" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Nombre</span>
            <Input value={draft.respondente?.nombre || ""} onChange={(e) => setDraft({ ...draft, respondente: { ...(draft.respondente || {}), nombre: e.target.value } })} placeholder="Nombre completo" />
          </label>
          <div className="text-xs text-slate-500">Si se deja vacío, la respuesta será anónima.</div>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-semibold mb-2">Preguntas</div>
          <ol className="space-y-3">
            {encuesta.preguntas.map((p, idx) => (
              <li key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
                <div className="text-sm font-medium mb-2">P{idx + 1}. {p.texto}</div>

                {p.tipo === "likert" && (
                  <div className="flex flex-wrap items-center gap-3">
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                      <label key={n} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={p.id}
                          value={n}
                          checked={draft.valores[p.id] === n}
                          onChange={() => setVal(p.id, n)}
                        />
                        <span>{n} <span className="text-xs text-slate-500">({likertLabels[n - 1]})</span></span>
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === "si_no" && (
                  <div className="flex items-center gap-4">
                    {(["SI", "NO"] as const).map((v) => (
                      <label key={v} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={p.id}
                          value={v}
                          checked={draft.valores[p.id] === v}
                          onChange={() => setVal(p.id, v)}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === "opciones" && (
                  <div className="grid gap-2">
                    {(p.opciones || []).map((op) => (
                      <label key={op} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={p.id}
                          value={op}
                          checked={draft.valores[p.id] === op}
                          onChange={() => setVal(p.id, op)}
                        />
                        <span>{op}</span>
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === "texto" && (
                  <Textarea
                    rows={3}
                    value={(draft.valores[p.id] as string) || ""}
                    onChange={(e) => setVal(p.id, e.target.value)}
                    placeholder="Escribe tu comentario…"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}

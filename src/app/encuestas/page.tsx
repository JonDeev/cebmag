"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus, ClipboardList, BarChart3, X, Trash2, Pencil, Save, Play,
} from "lucide-react";
import {
  getEncuestas,
  createEncuesta,
  updateEncuesta,
  deleteEncuesta,
  saveRespuesta,
  getResultados,
} from "@/lib/encuestas.api";
import toast from "react-hot-toast";

const genQId = () => `q_${Math.random().toString(36).slice(2, 10)}`;

/* ==================== Tipos ==================== */
type Estado = "BORRADOR" | "ACTIVA" | "INACTIVA";
type TipoPregunta = "likert" | "si_no" | "opciones" | "texto";

interface Pregunta {
  id?: string;
  tempId?: string;
  texto: string;
  tipo: TipoPregunta;
  opciones?: string[];
}

interface Encuesta {
  id?: string;
  titulo: string;
  servicio: string;
  estado: Estado;
  descripcion?: string;
  creada?: string;
  preguntas: Pregunta[];
}

interface Respuesta {
  encuestaId: string;
  respondente: {
    tipo_doc?: "CC" | "TI" | "CE" | "RC" | "PA";
    doc?: string;
    nombre?: string;
  };
  valores: Record<string, number | "SI" | "NO" | string>;
}

/* ==================== Helpers UI ==================== */
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
function Section({
  title,
  icon,
  children,
  actions,
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
      {/* Fondo */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Contenedor centrado */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`${
            wide ? "w-[min(980px,96vw)]" : "w-[min(640px,92vw)]"
          } max-h-[90vh] overflow-hidden rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl flex flex-col`}
        >
          {/* Header (no scrollea) */}
          <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3 shrink-0">
            <h4 className="text-sm font-semibold">{title}</h4>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>

          {/* Contenido (scrollea) */}
          <div className="min-h-0 p-4 overflow-y-auto grow">
            {children}
          </div>

          {/* Footer (no scrollea) */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3 shrink-0">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Página ==================== */
export default function EncuestasPage() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | Estado>("");
  const [sel, setSel] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState<Encuesta | null>(null);

  const [openResp, setOpenResp] = useState(false);
  const [respDraft, setRespDraft] = useState<Respuesta | null>(null);
  const [resultados, setResultados] = useState<any | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [targetDelete, setTargetDelete] = useState<Encuesta | null>(null);

  useEffect(() => {
    (async () => {
      const data = (await getEncuestas()) as Encuesta[];

      // Arregla encuestas viejas sin id en preguntas
      const fixed: Encuesta[] = await Promise.all(
        data.map(async (e: Encuesta) => {
          const needsFix = e.preguntas.some((p: Pregunta) => !p.id);
          if (needsFix && e.id) {
            const preguntas: Pregunta[] = e.preguntas.map((p: Pregunta) => ({
              ...p,
              id: p.id ?? genQId(),
            }));
            await updateEncuesta(e.id, { preguntas });
            return { ...e, preguntas };
          }
          return e;
        })
      );

      setEncuestas(fixed);
      if (fixed.length > 0 && !sel) setSel(fixed[0].id!);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sel) return;
    (async () => {
      const res = await getResultados(sel);
      setResultados(res?.resultados || []);
    })();
  }, [sel]);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return encuestas.filter((e) => {
      const okQ =
        !t ||
        [e.titulo, e.servicio, e.descripcion || ""]
          .join(" ")
          .toLowerCase()
          .includes(t);
      const okE = !estado || e.estado === estado;
      return okQ && okE;
    });
  }, [encuestas, q, estado]);

  const encSel = useMemo(
    () => encuestas.find((e) => e.id === sel) || null,
    [encuestas, sel]
  );

  /* ==================== CRUD ==================== */
  const nuevaEncuesta = () => {
    setDraft({
      titulo: "Nueva encuesta",
      servicio: "",
      estado: "BORRADOR",
      descripcion: "",
      preguntas: [],
    });
    setOpenEdit(true);
  };

  const guardarEncuesta = async () => {
    if (!draft) return;

    const preguntasNormalizadas = draft.preguntas.map((p) => ({
      ...p,
      id: p.id ?? p.tempId ?? genQId(),
      tempId: undefined,
    }));

    const data = {
      titulo: draft.titulo,
      servicio: draft.servicio,
      estado: draft.estado,
      descripcion: draft.descripcion,
      preguntas: preguntasNormalizadas,
    };

    try {
      const saved = draft.id
        ? await updateEncuesta(draft.id, data)
        : await createEncuesta(data);

      setEncuestas((prev) =>
        draft.id ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
      );
      setSel(saved.id);
      setOpenEdit(false);
      toast.success("Encuesta guardada");
    } catch (err: any) {
      console.error("[guardarEncuesta]", err);
      toast.error(err?.message || "Error al guardar");
    }
  };

  const eliminarEncuesta = async () => {
    if (!targetDelete) return;
    const ok = await deleteEncuesta(targetDelete.id!);
    if (ok) {
      const data = await getEncuestas();
      setEncuestas(data);
      if (sel === targetDelete.id) setSel(null);
      toast.success("Encuesta eliminada correctamente");
    }
    setOpenDelete(false);
    setTargetDelete(null);
  };

  /* ==================== Respuestas ==================== */
  const registrarResp = (e: Encuesta) => {
    const r: Respuesta = {
      encuestaId: e.id!,
      respondente: { tipo_doc: "CC" },
      valores: {},
    };
    setRespDraft(r);
    setOpenResp(true);
  };

  const guardarResp = async () => {
    if (!respDraft) return;
    try {
      await saveRespuesta(respDraft);
      toast.success("Respuesta registrada");
      const updated = await getEncuestas();
      setEncuestas(updated);
      setOpenResp(false);
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.toString?.() ||
        "Error desconocido al guardar la respuesta";
      console.error("[guardarResp] error:", err);
      toast.error(msg);
    }
  };

  return (
    <DashboardShell title="Encuestas de satisfacción">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista */}
        <div className="lg:col-span-1">
          <Section
            title="Encuestas"
            icon={<ClipboardList size={18} />}
            actions={
              <>
                <Input
                  placeholder="Buscar..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-40"
                />
                <Select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as Estado | "")}
                >
                  <option value="">Todos</option>
                  <option value="BORRADOR">Borrador</option>
                  <option value="ACTIVA">Activa</option>
                  <option value="INACTIVA">Inactiva</option>
                </Select>
                <Button onClick={nuevaEncuesta}>
                  <Plus size={16} /> Nueva
                </Button>
              </>
            }
          >
            <ul className="divide-y divide-[var(--subtle)]">
              {lista.map((e) => (
                <li
                  key={e.id}
                  className={`px-3 py-3 rounded hover:bg-white ${sel === e.id ? "bg-white" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => setSel(e.id!)} className="text-left">
                      <div className="text-sm font-semibold text-slate-800">
                        {e.titulo}
                      </div>
                      <div className="text-xs text-slate-500">
                        {e.servicio || "—"} • {e.estado} •{" "}
                        {new Date(e.creada || "").toLocaleDateString()}
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setDraft(e);
                          setOpenEdit(true);
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => registrarResp(e)}
                        title="Responder"
                      >
                        <Play size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setTargetDelete(e);
                          setOpenDelete(true);
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
              {lista.length === 0 && (
                <li className="px-3 py-6 text-sm text-center text-slate-500">
                  Sin encuestas.
                </li>
              )}
            </ul>
          </Section>
        </div>

        {/* Detalle */}
        <div className="lg:col-span-2">
          {encSel ? (
            <div className="grid gap-6">
              <Section
                title="Diseño"
                icon={<Pencil size={18} />}
                actions={
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDraft(encSel);
                        setOpenEdit(true);
                      }}
                    >
                      <Pencil size={14} /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => registrarResp(encSel)}
                    >
                      <Play size={14} /> Registrar respuesta
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <b>Título:</b> {encSel.titulo}
                  </div>
                  <div>
                    <b>Servicio:</b> {encSel.servicio}
                  </div>
                  <div className="md:col-span-2">
                    <b>Descripción:</b> {encSel.descripcion || "—"}
                  </div>
                </div>
                <div className="mt-4">
                  <b>Preguntas:</b>
                  <ol className="mt-2 space-y-2">
                    {encSel.preguntas.map((p, i) => (
                      <li
                        key={p.id}
                        className="rounded border border-[var(--subtle)] bg-white p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            P{i + 1}. {p.texto}
                          </span>
                          <span className="text-xs text-slate-500">
                            {p.tipo.toUpperCase()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </Section>

              <Section title="Resultados" icon={<BarChart3 size={18} />}>
                {!resultados || resultados.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aún no hay respuestas registradas.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {resultados.map((r: any, idx: number) => (
                      <div
                        key={r.pid}
                        className="rounded border border-[var(--subtle)] bg-white p-3"
                      >
                        <div className="mb-2 text-sm font-medium">
                          {encSel.preguntas[idx].texto}
                        </div>
                        {r.tipo === "likert" && (
                          <div className="text-xs text-slate-600">
                            Promedio: <b>{r.avg.toFixed(1)}</b> / 5
                          </div>
                        )}
                        {r.tipo === "si_no" && (
                          <div className="flex gap-3 text-sm">
                            <span>SI: {r.dist.SI}</span>
                            <span>NO: {r.dist.NO}</span>
                            <span>Total: {r.total}</span>
                          </div>
                        )}
                        {r.tipo === "opciones" && (
                          <ul className="space-y-1 text-sm">
                            {Object.entries(r.dist).map(([op, c]: any) => {
                              const pct = Math.round((c / r.total) * 100);
                              return (
                                <li key={op}>
                                  {op}: {c} ({pct}%)
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {r.tipo === "texto" && (
                          <div className="text-sm text-slate-600">
                            Respuestas abiertas: <b>{r.total}</b>
                          </div>
                        )}
                      </div>
                    ))}
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

      {/* Modales */}
      <EncuestaModal
        open={openEdit}
        setOpen={setOpenEdit}
        draft={draft}
        setDraft={setDraft}
        onSave={guardarEncuesta}
      />
      <RespuestaModal
        open={openResp}
        setOpen={setOpenResp}
        encuesta={encSel}
        draft={respDraft}
        setDraft={setRespDraft}
        onSave={guardarResp}
      />
      {/* Modal eliminar encuesta */}
      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title="Confirmar eliminación"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button
              onClick={eliminarEncuesta}
              className="text-white bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 size={16} /> Eliminar
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-700">
          ¿Seguro que deseas eliminar la encuesta <b>{targetDelete?.titulo}</b>?<br />
          Esta acción no se puede deshacer.
        </div>
      </Modal>
    </DashboardShell>
  );
}

/* ==================== Modales ==================== */
function EncuestaModal({
  open,
  setOpen,
  draft,
  setDraft,
  onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Encuesta | null;
  setDraft: (e: Encuesta | null) => void;
  onSave: () => void;
}) {
  if (!draft) return null;

  const addPregunta = (tipo: TipoPregunta) => {
    const p: Pregunta = {
      id: genQId(),
      tempId: undefined,
      texto: "Nueva pregunta",
      tipo,
      opciones: tipo === "opciones" ? ["Opción 1", "Opción 2"] : [],
    };
    setDraft({ ...draft, preguntas: [...draft.preguntas, p] });
  };

  const rmPregunta = (id?: string) => {
    if (!id) return;
    setDraft({
      ...draft,
      preguntas: draft.preguntas.filter((p) => p.id !== id && p.tempId !== id),
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Diseño de encuesta"
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            <Save size={16} /> Guardar
          </Button>
        </>
      }
      wide
    >
      {/* Grid de 2 columnas: izquierda fija (340px) / derecha flexible */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[340px_1fr] items-start">
        {/* --- Columna izquierda (fija + sticky) --- */}
        <div className="grid gap-4 md:col-span-1 md:sticky md:top-0 w-[340px] shrink-0">
          <label className="text-sm">
            Título
            <Input
              value={draft.titulo}
              onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
            />
          </label>

          <label className="text-sm">
            Servicio
            <Input
              value={draft.servicio}
              onChange={(e) => setDraft({ ...draft, servicio: e.target.value })}
            />
          </label>

          <label className="text-sm">
            Estado
            <Select
              value={draft.estado}
              onChange={(e) =>
                setDraft({ ...draft, estado: e.target.value as Estado })
              }
            >
              <option value="BORRADOR">Borrador</option>
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
            </Select>
          </label>

          <label className="text-sm">
            Descripción
            <Textarea
              rows={3}
              value={draft.descripcion}
              onChange={(e) =>
                setDraft({ ...draft, descripcion: e.target.value })
              }
            />
          </label>

          <div className="mt-2 text-sm font-semibold">Agregar pregunta</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => addPregunta("likert")}>
              Likert (1–5)
            </Button>
            <Button variant="outline" onClick={() => addPregunta("si_no")}>
              Sí/No
            </Button>
            <Button variant="outline" onClick={() => addPregunta("opciones")}>
              Opción única
            </Button>
            <Button variant="outline" onClick={() => addPregunta("texto")}>
              Texto libre
            </Button>
          </div>
        </div>

        {/* --- Columna derecha (preguntas) --- */}
        <div className="min-w-0 md:col-span-1">
          <div className="mb-2 text-sm font-semibold">Preguntas</div>
          <ol className="space-y-2">
            {draft.preguntas.map((p, idx) => (
              <li
                key={p.id}
                className="rounded border border-[var(--subtle)] bg-white p-3"
              >
                {p.tipo === "opciones" && (
                  <div className="grid gap-2 mt-3">
                    <div className="text-sm font-medium">Opciones</div>
                    {(p.opciones || []).map((op, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={op}
                          onChange={(e) => {
                            const arr = [...draft.preguntas];
                            const opciones = [...(p.opciones || [])];
                            opciones[i] = e.target.value;
                            arr[idx] = { ...p, opciones };
                            setDraft({ ...draft, preguntas: arr });
                          }}
                        />
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const arr = [...draft.preguntas];
                            const opciones = (p.opciones || []).filter(
                              (_, j) => j !== i
                            );
                            arr[idx] = { ...p, opciones };
                            setDraft({ ...draft, preguntas: arr });
                          }}
                          title="Quitar opción"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => {
                        const arr = [...draft.preguntas];
                        const opciones = [
                          ...(p.opciones || []),
                          `Opción ${
                            p.opciones?.length ? p.opciones.length + 1 : 1
                          }`,
                        ];
                        arr[idx] = { ...p, opciones };
                        setDraft({ ...draft, preguntas: arr });
                      }}
                    >
                      <Plus size={14} /> Agregar opción
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={p.texto}
                    onChange={(e) => {
                      const arr = [...draft.preguntas];
                      arr[idx] = { ...p, texto: e.target.value };
                      setDraft({ ...draft, preguntas: arr });
                    }}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => rmPregunta(p.id || p.tempId)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
            {draft.preguntas.length === 0 && (
              <li className="text-sm text-slate-500">Aún no hay preguntas.</li>
            )}
          </ol>
        </div>
      </div>
    </Modal>
  );
}


function RespuestaModal({
  open,
  setOpen,
  encuesta,
  draft,
  setDraft,
  onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  encuesta: Encuesta | null;
  draft: Respuesta | null;
  setDraft: (r: Respuesta | null) => void;
  onSave: () => void;
}) {
  if (!encuesta || !draft) return null;

  // Asegura tipo_doc por defecto al abrir
  useEffect(() => {
    if (draft && (!draft.respondente || !draft.respondente.tipo_doc)) {
      setDraft({
        ...draft,
        respondente: { ...(draft.respondente || {}), tipo_doc: "CC" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setVal = (pid: string, val: number | "SI" | "NO" | string) =>
    setDraft({ ...draft, valores: { ...draft.valores, [pid]: val } });

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Registrar respuesta — ${encuesta.titulo}`}
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            <Save size={16} /> Guardar
          </Button>
        </>
      }
      wide
    >
      {/* Grid: izquierda fija (340px) / derecha flexible */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[340px_1fr] items-start">
        {/* --- Columna izquierda: datos del respondente (sticky) --- */}
        <div className="grid gap-3 md:sticky md:top-0 w-[340px] shrink-0">
          <label className="text-sm">
            Tipo de documento
            <Select
              value={draft.respondente?.tipo_doc ?? "CC"}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  respondente: {
                    ...(draft.respondente || {}),
                    tipo_doc:
                      e.target.value as Respuesta["respondente"]["tipo_doc"],
                  },
                })
              }
            >
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="TI">Tarjeta de Identidad (TI)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="RC">Registro Civil (RC)</option>
              <option value="PA">Pasaporte (PA)</option>
            </Select>
          </label>

          <label className="text-sm">
            Documento
            <Input
              value={draft.respondente?.doc || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  respondente: {
                    ...(draft.respondente || {}),
                    doc: e.target.value,
                  },
                })
              }
            />
          </label>

          <label className="text-sm">
            Nombre
            <Input
              value={draft.respondente?.nombre || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  respondente: {
                    ...(draft.respondente || {}),
                    nombre: e.target.value,
                  },
                })
              }
            />
          </label>
        </div>

        {/* --- Columna derecha: preguntas --- */}
        <div className="min-w-0">
          {encuesta.preguntas.map((p, idx) => {
            const qid = p.id ?? p.tempId ?? `idx_${idx}`;
            return (
              <div
                key={qid}
                className="rounded border border-[var(--subtle)] bg-white p-3 mb-2"
              >
                <div className="mb-1 text-sm font-medium">
                  P{idx + 1}. {p.texto}
                </div>

                {p.tipo === "likert" && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="text-sm">
                        <input
                          type="radio"
                          name={`preg_${qid}`}
                          checked={draft.valores[qid] === n}
                          onChange={() => setVal(qid, n)}
                        />{" "}
                        {n}
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === "si_no" && (
                  <div className="flex gap-3">
                    {(["SI", "NO"] as const).map((v) => (
                      <label key={v} className="text-sm">
                        <input
                          type="radio"
                          name={`preg_${qid}`}
                          checked={draft.valores[qid] === v}
                          onChange={() => setVal(qid, v)}
                        />{" "}
                        {v}
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === "opciones" && (
                  <div className="flex flex-col gap-1">
                    {(p.opciones || []).map((op) => (
                      <label key={op} className="text-sm">
                        <input
                          type="radio"
                          name={`preg_${qid}`}
                          checked={draft.valores[qid] === op}
                          onChange={() => setVal(qid, op)}
                        />{" "}
                        {op}
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === "texto" && (
                  <Textarea
                    rows={2}
                    value={(draft.valores[qid] as string) || ""}
                    onChange={(e) => setVal(qid, e.target.value)}
                    placeholder="Tu comentario..."
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}


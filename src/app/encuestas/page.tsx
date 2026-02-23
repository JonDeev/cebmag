"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus,
  ClipboardList,
  BarChart3,
  X,
  Trash2,
  Pencil,
  Save,
  Play,
  Search,
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

// Prisma TipoDocumento (ya lo vienes usando en beneficiario)
type TipoDoc = "CC" | "TI" | "CE" | "RC" | "PA" | "PEP" | "PPT" | "NIT" | "OTRO";

interface Pregunta {
  id?: string;
  tempId?: string;
  texto: string;
  tipo: TipoPregunta;
  opciones?: string[];
}

interface Encuesta {
  id?: number; // ✅ Int
  titulo: string;
  servicio: string;
  estado: Estado;
  descripcion?: string;
  creada?: string;
  preguntas: Pregunta[];
}

interface Respuesta {
  encuestaId: number; // ✅ Int
  respondente: {
    tipo_doc?: TipoDoc;
    doc?: string;

    // UI extra para crear/vincular (la BD solo guarda nombre/documento/tipo_doc)
    nombre?: string; // nombre completo (se guarda)
    nombres?: string; // opcional para crear beneficiario
    apellidos?: string; // opcional para crear beneficiario
    telefono?: string;
    email?: string;

    beneficiarioId?: number | null;
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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`${
            wide ? "w-[min(980px,96vw)]" : "w-[min(640px,92vw)]"
          } max-h-[90vh] overflow-hidden rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl flex flex-col`}
        >
          <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3 shrink-0">
            <h4 className="text-sm font-semibold">{title}</h4>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 p-4 overflow-y-auto grow">{children}</div>

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
  const [sel, setSel] = useState<number | null>(null); // ✅ Int

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
      if (fixed.length > 0 && sel == null) setSel(fixed[0].id ?? null);
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
        [e.titulo, e.servicio, e.descripcion || ""].join(" ").toLowerCase().includes(t);
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

      // ✅ si el backend falló, tu api retorna null
      if (!saved || !saved.id) {
        toast.error("No se pudo guardar la encuesta. Revisa el error del backend.");
        return;
      }

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
    if (!targetDelete?.id) return;
    const ok = await deleteEncuesta(targetDelete.id);
    if (ok) {
      const data = await getEncuestas();
      setEncuestas(data as any);
      if (sel === targetDelete.id) setSel(null);
      toast.success("Encuesta eliminada correctamente");
    }
    setOpenDelete(false);
    setTargetDelete(null);
  };

  /* ==================== Respuestas ==================== */
  const registrarResp = (e: Encuesta) => {
    if (!e.id) return;
    const r: Respuesta = {
      encuestaId: e.id,
      respondente: { tipo_doc: "CC", doc: "", nombre: "", nombres: "", apellidos: "", beneficiarioId: null },
      valores: {},
    };
    setRespDraft(r);
    setOpenResp(true);
  };

  const guardarResp = async () => {
    if (!respDraft) return;

    // ✅ asegurar nombre final
    const nombres = (respDraft.respondente?.nombres ?? "").trim();
    const apellidos = (respDraft.respondente?.apellidos ?? "").trim();
    const nombreFinal =
      (nombres || apellidos) ? [nombres, apellidos].filter(Boolean).join(" ") : (respDraft.respondente?.nombre ?? "").trim();

    if (!respDraft.respondente?.tipo_doc) return toast.error("Tipo de documento requerido");
    if (!respDraft.respondente?.doc?.trim()) return toast.error("Documento requerido");
    if (!nombreFinal) return toast.error("Nombre requerido");

    const payload: Respuesta = {
      ...respDraft,
      respondente: { ...respDraft.respondente, nombre: nombreFinal },
    };

    try {
      await saveRespuesta(payload);
      toast.success("Respuesta registrada");
      const updated = await getEncuestas();
      setEncuestas(updated as any);
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
                        {e.creada ? new Date(e.creada).toLocaleDateString() : "—"}
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
                        key={r.pid ?? idx}
                        className="rounded border border-[var(--subtle)] bg-white p-3"
                      >
                        <div className="mb-2 text-sm font-medium">
                          {encSel.preguntas[idx]?.texto ?? "Pregunta"}
                        </div>
                        {r.tipo === "likert" && (
                          <div className="text-xs text-slate-600">
                            Promedio: <b>{Number(r.avg).toFixed(1)}</b> / 5
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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[340px_1fr] items-start">
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
              onChange={(e) => setDraft({ ...draft, estado: e.target.value as Estado })}
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
              onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
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

        <div className="min-w-0 md:col-span-1">
          <div className="mb-2 text-sm font-semibold">Preguntas</div>
          <ol className="space-y-2">
            {draft.preguntas.map((p, idx) => (
              <li key={p.id} className="rounded border border-[var(--subtle)] bg-white p-3">
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
                            const opciones = (p.opciones || []).filter((_, j) => j !== i);
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
                          `Opción ${p.opciones?.length ? p.opciones.length + 1 : 1}`,
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
                  <Button variant="ghost" onClick={() => rmPregunta(p.id || p.tempId)} title="Eliminar">
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
  const [benefLoading, setBenefLoading] = useState(false);
  const [benefState, setBenefState] = useState<"idle" | "found" | "notfound" | "created">("idle");

  // ✅ HOOKS SIEMPRE ARRIBA (sin returns antes)
  useEffect(() => {
    if (!open) return;
    if (!draft) return;

    if (!draft.respondente || !draft.respondente.tipo_doc) {
      setDraft({
        ...draft,
        respondente: { ...(draft.respondente || {}), tipo_doc: "CC" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft]);

  // ✅ ahora sí puedes retornar (después de hooks)
  if (!open) return null;
  if (!encuesta || !draft) return null;

  const setVal = (pid: string, val: number | "SI" | "NO" | string) =>
    setDraft({ ...draft, valores: { ...draft.valores, [pid]: val } });

  const setResp = (patch: Partial<Respuesta["respondente"]>) => {
    setDraft({
      ...draft,
      respondente: { ...(draft.respondente || {}), ...patch },
    });
  };

  const buscarBeneficiario = async () => {
    const tipo = draft.respondente?.tipo_doc || "CC";
    const doc = (draft.respondente?.doc || "").trim();
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
        setBenefState("notfound");
        setResp({ beneficiarioId: null });
        return toast("No existe. Puedes crearlo con el botón 'Crear beneficiario'.");
      }

      const idFound = typeof data.id === "number" ? data.id : Number(data.id);
      const nombre = [data.nombres, data.apellidos].filter(Boolean).join(" ").trim();

      setBenefState("found");
      setResp({
        beneficiarioId: Number.isFinite(idFound) ? idFound : null,
        tipo_doc: (data.tipo_doc ?? tipo) as TipoDoc,
        doc: data.num_doc ?? doc,
        nombres: data.nombres ?? "",
        apellidos: data.apellidos ?? "",
        nombre: nombre || (draft.respondente?.nombre ?? ""),
        telefono: data.telefono ?? "",
        email: data.email ?? "",
      });

      toast.success("Beneficiario encontrado ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Error buscando beneficiario");
    } finally {
      setBenefLoading(false);
    }
  };

  const crearBeneficiario = async () => {
    const tipo = draft.respondente?.tipo_doc || "CC";
    const doc = (draft.respondente?.doc || "").trim();
    const nombres = (draft.respondente?.nombres || "").trim();
    const apellidos = (draft.respondente?.apellidos || "").trim();

    if (!tipo || !doc) return toast.error("Falta tipo/doc.");
    if (!nombres) return toast.error("Faltan los nombres.");
    if (!apellidos) return toast.error("Faltan los apellidos.");

    try {
      setBenefLoading(true);

      const payload = {
        tipo_doc: tipo,
        num_doc: doc,
        nombres,
        apellidos,
        telefono: draft.respondente?.telefono ?? "",
        email: draft.respondente?.email ?? "",
      };

      const res = await fetch("/api/beneficiarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "No se pudo crear el beneficiario.");

      const idCreated = typeof j.id === "number" ? j.id : Number(j.id);
      setBenefState("created");

      setResp({
        beneficiarioId: Number.isFinite(idCreated) ? idCreated : null,
        nombre: [nombres, apellidos].filter(Boolean).join(" ").trim(),
      });

      toast.success("Beneficiario creado ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Error creando beneficiario");
    } finally {
      setBenefLoading(false);
    }
  };

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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[340px_1fr] items-start">
        {/* Col izquierda */}
        <div className="grid gap-3 md:sticky md:top-0 w-[340px] shrink-0">
          <div className="flex items-center gap-2">
            {draft.respondente?.beneficiarioId ? (
              <span className="px-2 py-1 text-xs border rounded-full bg-emerald-50 text-emerald-700">
                Beneficiario vinculado
              </span>
            ) : benefState === "notfound" ? (
              <span className="px-2 py-1 text-xs border rounded-full bg-rose-50 text-rose-700">
                No existe
              </span>
            ) : (
              <span className="px-2 py-1 text-xs border rounded-full bg-slate-50 text-slate-700">
                Sin vincular
              </span>
            )}
          </div>

          <label className="text-sm">
            Tipo de documento
            <Select
              value={draft.respondente?.tipo_doc ?? "CC"}
              onChange={(e) => {
                setBenefState("idle");
                setResp({ tipo_doc: e.target.value as TipoDoc, beneficiarioId: null });
              }}
            >
              {(["CC","TI","CE","RC","PA","PEP","PPT","NIT","OTRO"] as TipoDoc[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </label>

          <label className="text-sm">
            Documento
            <Input
              value={draft.respondente?.doc || ""}
              onChange={(e) => {
                setBenefState("idle");
                setResp({ doc: e.target.value, beneficiarioId: null });
              }}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" type="button" onClick={buscarBeneficiario} disabled={benefLoading}>
              <Search size={14} /> {benefLoading ? "Buscando..." : "Buscar"}
            </Button>
            <Button variant="outline" type="button" onClick={crearBeneficiario} disabled={benefLoading}>
              <Plus size={14} /> Crear
            </Button>
          </div>

          <label className="text-sm">
            Nombres
            <Input value={draft.respondente?.nombres || ""} onChange={(e) => setResp({ nombres: e.target.value })} />
          </label>

          <label className="text-sm">
            Apellidos
            <Input value={draft.respondente?.apellidos || ""} onChange={(e) => setResp({ apellidos: e.target.value })} />
          </label>

          <label className="text-sm">
            Nombre
            <Input value={draft.respondente?.nombre || ""} onChange={(e) => setResp({ nombre: e.target.value })} />
          </label>
        </div>

        {/* Preguntas */}
        <div className="min-w-0">
          {encuesta.preguntas.map((p, idx) => {
            const qid = p.id ?? p.tempId ?? `idx_${idx}`;
            return (
              <div key={qid} className="rounded border border-[var(--subtle)] bg-white p-3 mb-2">
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
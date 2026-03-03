"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus,
  ClipboardList,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  FileSignature,
  User,
  ShieldCheck,
  Briefcase,
  Copy,
  Printer,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  getInscripciones,
  createInscripcion,
  updateInscripcion,
  deleteInscripcion,
  type Inscripcion,
  type Estado,
  type TipoPersonal,
  type Modalidad,
  type Jornada,
} from "@/lib/inscripciones.api";

import DocumentDropzone from "@/components/files/DocumentDropzone";

/* ============== Helpers UI ============== */
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

/* ============== Modal animado ============== */
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
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/30"
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
                wide ? "w-[min(980px,96vw)]" : "w-[min(720px,92vw)]",
                "max-h-[92vh] overflow-hidden",
                "rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-2xl",
                "flex flex-col",
              ].join(" ")}
            >
              <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
                <h4 className="text-sm font-semibold">{title}</h4>
                <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" type="button">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 min-h-0 p-4 overflow-y-auto">{children}</div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3">
                {actions}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const HOY = new Date().toISOString().slice(0, 10);

type ActividadApi = {
  id: number;
  codigo: string;
  nombre: string;
  estado: "Abierta" | "Cerrada" | string;
};

const actividadLabel = (a: ActividadApi) => `${a.codigo} • ${a.nombre}`;

const pickDefaultActividad = (arr: ActividadApi[]) => {
  const abiertas = arr.filter((x) => String(x.estado).toLowerCase() === "abierta");
  return (abiertas[0] ?? arr[0]) || null;
};

const canGenerateContract = (r: Inscripcion) =>
  r.evaluacion?.decision === "Aprobar" &&
  (r.evaluacion?.puntaje ?? 0) >= 70 &&
  !!r.evaluacion?.docsOk?.cv &&
  !!r.evaluacion?.docsOk?.doc &&
  !!r.evaluacion?.docsOk?.certificados;

function computeEstadoFromDecision(d: Inscripcion): Estado {
  if (d.estado === "Contrato generado" || d.estado === "Firmado") return d.estado;

  const dec = d.evaluacion?.decision;
  if (dec === "Aprobar") return "Aprobada";
  if (dec === "Rechazar") return "Rechazada";
  return "En evaluación";
}

/* ============== Draft para crear (id=0) ============== */
function newDraft(): Inscripcion {
  return {
    id: 0,
    radicado: "",
    fecha: HOY,
    tipo: "Asistencial",
    candidato: {
      tipo_doc: "CC",
      doc: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      email: "",
      direccion: "",
      ciudad: "",
    },
    cargo: "",
    // ✅ ya NO hay actividades quemadas:
    // dejamos vacío y se setea en `nueva()` con pickDefaultActividad(actividades)
    actividad: "",
    estado: "En evaluación",
    evaluacion: {
      puntaje: 0,
      docsOk: { cv: false, doc: false, certificados: false, rut: false },
      concepto: "",
      decision: undefined,
    },
    contrato: undefined,
    adjuntos: [],
  };
}
/* ============== Página principal ============== */
export default function InscripcionesPage() {
  const title = "Inscripciones y contratos";

  const [rows, setRows] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState<"" | Estado>("");
  const [fTipo, setFTipo] = useState<"" | TipoPersonal>("");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Inscripcion | null>(null);
  const [step, setStep] = useState(1);

  const [openDelete, setOpenDelete] = useState(false);
  const [targetDelete, setTargetDelete] = useState<Inscripcion | null>(null);

  const [actividades, setActividades] = useState<ActividadApi[]>([]);
  const [actividadesLoading, setActividadesLoading] = useState(false);

  const loadActividades = async () => {
    setActividadesLoading(true);
    try {
      const res = await fetch(`/api/costos/actividades?ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
      });
      if (!res.ok) throw new Error("No se pudo cargar actividades");
      const data = await res.json();
      setActividades(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar actividades");
      setActividades([]);
    } finally {
      setActividadesLoading(false);
    }
  };

  const reload = async (qOverride?: string) => {
    setLoading(true);
    try {
      const res = await getInscripciones({
        q: qOverride ?? q,
        estado: fEstado,
        tipo: fTipo,
        page: 1,
        pageSize: 200,
      });
      setRows(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  // ✅ debounce para q + filtros
  useEffect(() => {
    const t = setTimeout(() => {
      reload().catch(() => {});
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, fEstado, fTipo]);

  useEffect(() => {
    loadActividades().catch(() => {});
    reload().catch(() => toast.error("No se pudo cargar inscripciones"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!actividades.length) return;

    setDraft((prev) => {
      if (!prev) return prev;
      if (prev.actividad?.trim()) return prev;
      const def = pickDefaultActividad(actividades);
      return def ? { ...prev, actividad: actividadLabel(def) } : prev;
    });
  }, [open, actividades, setDraft]);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ =
        !t ||
        [
          r.radicado,
          r.candidato?.nombres,
          r.candidato?.apellidos,
          r.candidato?.doc,
          r.cargo,
          r.actividad,
        ]
          .join(" ")
          .toLowerCase()
          .includes(t);

      const okE = !fEstado || r.estado === fEstado;
      const okT = !fTipo || r.tipo === fTipo;

      return okQ && okE && okT;
    });
  }, [rows, q, fEstado, fTipo]);

  const nueva = () => {
    const d = newDraft();
    const def = pickDefaultActividad(actividades);
    d.actividad = def ? actividadLabel(def) : "";
    setDraft(d);
    setStep(1);
    setOpen(true);
  };

  const editar = (r: Inscripcion) => {
    setDraft(JSON.parse(JSON.stringify(r)));
    setStep(1);
    setOpen(true);
  };

  const guardar = async () => {
    if (!draft) return;

    if (!draft.candidato?.doc || !draft.candidato?.nombres || !draft.candidato?.apellidos || !draft.cargo) {
      toast.error("Faltan datos obligatorios del candidato.");
      return;
    }

    const normalizedEstado = computeEstadoFromDecision(draft);

    const payload: any = {
      fecha: draft.fecha,
      tipo: draft.tipo,
      candidato: draft.candidato,
      cargo: draft.cargo,
      actividad: draft.actividad,
      estado: normalizedEstado,
      evaluacion: draft.evaluacion,
      contrato: draft.contrato ?? undefined,
      adjuntos: draft.adjuntos ?? [],
    };

    const saved =
      draft.id && draft.id > 0
        ? await updateInscripcion(draft.id, payload)
        : await createInscripcion(payload);

    if (!saved) return;

    toast.success("Guardado ✅");
    setDraft(saved);
    await reload();
  };

  const confirmDelete = (r: Inscripcion) => {
    setTargetDelete(r);
    setOpenDelete(true);
  };

  const doDelete = async () => {
    if (!targetDelete?.id) return;
    const ok = await deleteInscripcion(targetDelete.id);
    if (ok) {
      toast.success("Inscripción eliminada ✅");
      await reload();
    }
    setOpenDelete(false);
    setTargetDelete(null);
  };

  const generarContrato = async () => {
    if (!draft) return;

    if (!draft.id || draft.id <= 0) {
      toast.error("Primero guarda la inscripción para poder generar el contrato.");
      return;
    }

    const ev = draft.evaluacion;
    const okDocs = ev?.docsOk?.cv && ev?.docsOk?.doc && ev?.docsOk?.certificados;
    const okScore = (ev?.puntaje ?? 0) >= 70;
    const okDecision = ev?.decision === "Aprobar";

    if (!okDecision) return toast.error("Para generar contrato, la decisión debe ser 'Aprobar'.");
    if (!okScore) return toast.error("Para generar contrato, el puntaje debe ser ≥ 70.");
    if (!okDocs) return toast.error("Para generar contrato, CV/Documento/Certificados deben estar OK.");

    const c = draft.contrato;
    if (!c) return toast.error("Completa los datos del contrato (Paso 3).");
    if (!c.modalidad || !c.jornada || !c.salarioTipo) return toast.error("Faltan datos del contrato.");
    if (!c.inicio) return toast.error("La fecha de inicio es obligatoria.");
    if ((c.valor ?? 0) <= 0) return toast.error("El valor del contrato debe ser mayor que 0.");
    if (c.modalidad === "Temporal" && !c.fin) {
      return toast.error("En modalidad Temporal la fecha fin es obligatoria.");
    }

    const saved = await updateInscripcion(draft.id, {
      estado: "Contrato generado",
      evaluacion: draft.evaluacion,
      contrato: draft.contrato,
    } as any);

    if (!saved) return;

    toast.success("Contrato generado ✅");
    setDraft(saved);
    await reload();
  };

  const marcarFirmado = async (r: Inscripcion) => {
    const saved = await updateInscripcion(r.id, { estado: "Firmado" } as any);
    if (!saved) return;
    toast.success("Marcado como firmado ✅");
    await reload();
  };

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6">
        <Section
          title="Listado de inscripciones"
          icon={<ClipboardList size={18} />}
          actions={
            <>
              <div className="items-center hidden gap-2 md:flex">
                <Input
                  placeholder="Buscar por nombre, cargo, radicado…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-64"
                />
                <Select value={fTipo} onChange={(e) => setFTipo(e.target.value as TipoPersonal | "")}>
                  <option value="">Tipo: Todos</option>
                  {(["Administrativo", "Asistencial"] as const).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Select value={fEstado} onChange={(e) => setFEstado(e.target.value as Estado | "")}>
                  <option value="">Estado: Todos</option>
                  {(["En evaluación", "Aprobada", "Rechazada", "Contrato generado", "Firmado"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={nueva}>
                <Plus size={16} /> Nueva inscripción
              </Button>
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                  <th className="py-2 pl-4 pr-3 text-left">Radicado</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Candidato</th>
                  <th className="px-3 py-2 text-left">Cargo</th>
                  <th className="px-3 py-2 text-left">Actividad</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="text-left py-2 px-3 w-[320px]">Acciones</th>
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
                  lista.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--subtle)]/70">
                      <td className="py-2 pl-4 pr-3 font-medium">{r.radicado || "—"}</td>
                      <td className="px-3 py-2">{r.fecha}</td>
                      <td className="px-3 py-2">{r.tipo}</td>
                      <td className="px-3 py-2">
                        {r.candidato?.nombres} {r.candidato?.apellidos}{" "}
                        <span className="text-slate-500">({r.candidato?.doc || "s/d"})</span>
                      </td>
                      <td className="px-3 py-2">{r.cargo || "—"}</td>
                      <td className="px-3 py-2">{r.actividad}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[12px] rounded-full border px-2 py-0.5 ${
                            r.estado === "Firmado"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : r.estado === "Contrato generado"
                              ? "bg-sky-100 text-sky-700 border-sky-200"
                              : r.estado === "Aprobada"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : r.estado === "Rechazada"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => editar(r)}>
                            <Pencil size={14} /> Abrir
                          </Button>

                          {r.estado === "Contrato generado" && (
                            <Button variant="outline" onClick={() => marcarFirmado(r)}>
                              <CheckCircle2 size={14} /> Marcar firmado
                            </Button>
                          )}

                          <Button variant="ghost" onClick={() => confirmDelete(r)}>
                            <Trash2 size={14} /> Quitar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && lista.length === 0 && (
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

      {/* Modal asistente por pasos */}
      <WizardModal
        open={open}
        setOpen={setOpen}
        draft={draft}
        setDraft={setDraft}
        step={step}
        setStep={setStep}
        onSave={guardar}
        onGenerate={generarContrato}
        actividades={actividades}
        actividadesLoading={actividadesLoading}
        reloadActividades={loadActividades}
      />

      {/* Confirmar eliminación */}
      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title="Confirmar eliminación"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button onClick={doDelete} className="text-white bg-rose-600 hover:bg-rose-700">
              <Trash2 size={16} /> Eliminar
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-700">
          ¿Seguro que deseas eliminar la inscripción <b>{targetDelete?.radicado || "(sin radicado)"}</b> de{" "}
          <b>
            {targetDelete
              ? `${targetDelete.candidato?.nombres || ""} ${targetDelete.candidato?.apellidos || ""}`.trim()
              : ""}
          </b>
          ?<br />
          Esta acción no se puede deshacer.
        </div>
      </Modal>
    </DashboardShell>
  );
}

/* ============== Wizard Modal ============== */
function WizardModal({
  open,
  setOpen,
  draft,
  setDraft,
  step,
  setStep,
  onSave,
  onGenerate,
  actividades,
  actividadesLoading,
  reloadActividades,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Inscripcion | null;
  setDraft: React.Dispatch<React.SetStateAction<Inscripcion | null>>;
  step: number;
  setStep: (n: number) => void;
  onSave: () => void;
  onGenerate: () => void;
  actividades: ActividadApi[];
  actividadesLoading: boolean;
  reloadActividades: () => Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  if (!draft) return null;

  const next = () => setStep(Math.min(4, step + 1));
  const prev = () => setStep(Math.max(1, step - 1));

  const validStep1 =
    !!draft.candidato?.nombres &&
    !!draft.candidato?.apellidos &&
    !!draft.candidato?.doc &&
    !!draft.cargo &&
    !!draft.actividad;

  const validStep2 =
    draft.evaluacion?.decision === "Aprobar" || draft.evaluacion?.decision === "Rechazar";

  const validContrato =
    !!draft.contrato?.modalidad &&
    !!draft.contrato?.jornada &&
    !!draft.contrato?.salarioTipo &&
    (draft.contrato?.valor || 0) > 0 &&
    !!draft.contrato?.inicio &&
    (draft.contrato?.modalidad !== "Temporal" || !!draft.contrato?.fin);

  const canGen = canGenerateContract(draft) && validContrato;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Inscripción — ${draft.radicado || "sin radicado"}`}
      wide
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cerrar
          </Button>

          {step > 1 && (
            <Button variant="outline" onClick={prev}>
              Atrás
            </Button>
          )}

          {step < 4 && (
            <Button
              onClick={next}
              disabled={
                (step === 1 && !validStep1) ||
                (step === 2 && !validStep2) ||
                (step === 3 && !validContrato)
              }
            >
              Siguiente
            </Button>
          )}

          {step === 4 && (
            <>
              <Button variant="outline" onClick={onSave}>
                <FileDown size={16} /> Guardar
              </Button>
              <Button onClick={onGenerate} disabled={!canGen}>
                <FileSignature size={16} /> Generar contrato
              </Button>
            </>
          )}
        </>
      }
    >
      <Stepper step={step} />

      {/* ✅ transición entre pasos */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, x: 10 }}
          animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
        >
          {step === 1 && (
            <PasoDatos
              draft={draft}
              setDraft={setDraft}
              actividades={actividades}
              actividadesLoading={actividadesLoading}
              reloadActividades={reloadActividades}
            />
          )}

          {step === 2 && <PasoEvaluacion draft={draft} setDraft={setDraft} />}

          {step === 3 && <PasoContrato draft={draft} setDraft={setDraft} />}

          {step === 4 && <PasoPreview draft={draft} />}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}

/* ============== Stepper ============== */
function Stepper({ step }: { step: number }) {
  const items = [
    { n: 1, t: "Candidato" },
    { n: 2, t: "Evaluación" },
    { n: 3, t: "Contrato" },
    { n: 4, t: "Previsualización" },
  ];
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      {items.map((it, idx) => (
        <div key={it.n} className="flex items-center flex-1 gap-2">
          <div className={`flex items-center gap-2 ${idx > 0 ? "w-full" : ""}`}>
            {idx > 0 && (
              <div className={`h-[2px] flex-1 rounded ${step > it.n ? "bg-[var(--brand)]" : "bg-slate-200"}`} />
            )}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] border ${
                step >= it.n
                  ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                  : "bg-white text-slate-600 border-[var(--subtle)]"
              }`}
            >
              {it.n}
            </div>
            <div className={`text-xs ${step >= it.n ? "text-slate-800" : "text-slate-500"}`}>{it.t}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============== Paso 1: Datos ============== */
function PasoDatos({
  draft,
  setDraft,
  actividades,
  actividadesLoading,
  reloadActividades,
}: {
  draft: Inscripcion;
  setDraft: React.Dispatch<React.SetStateAction<Inscripcion | null>>;
  actividades: ActividadApi[];
  actividadesLoading: boolean;
  reloadActividades: () => Promise<void>;
}) {
  // ✅ Adjuntos guardados (metadata) + nuevos (File[])
  type AdjMeta = { name: string; size: number };

  const [adjSaved, setAdjSaved] = useState<AdjMeta[]>(
    Array.isArray(draft.adjuntos) ? (draft.adjuntos as any) : []
  );
  const [adjNew, setAdjNew] = useState<File[]>([]);

  // ✅ cuando cambia el draft (abrir otra inscripción), reinicia estados locales
  useEffect(() => {
    setAdjSaved(Array.isArray(draft.adjuntos) ? (draft.adjuntos as any) : []);
    setAdjNew([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, draft.radicado]);

  // ✅ sincroniza SIEMPRE draft.adjuntos = adjSaved + adjNew (metadata), sin duplicados
  useEffect(() => {
    const saved = (adjSaved || []).map((x) => ({
      name: String((x as any)?.name ?? (x as any)?.nombre ?? "").trim(),
      size: Number((x as any)?.size ?? 0),
    })).filter((x) => x.name);

    const news = (adjNew || []).map((f) => ({ name: f.name, size: f.size }));

    const seen = new Set<string>();
    const merged = [...saved, ...news].filter((x) => {
      const k = `${x.name}__${x.size}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    setDraft((prev) => (prev ? { ...prev, adjuntos: merged as any } : prev));
  }, [adjSaved, adjNew, setDraft]);

  const removeSaved = (name: string, size: number) => {
    setAdjSaved((prev) => prev.filter((a) => !(a.name === name && a.size === size)));
  };

  return (
    <Section title="Datos del candidato" icon={<User size={18} />}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tipo de personal</span>
          <Select
            value={draft.tipo}
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, tipo: e.target.value as any } : prev))
            }
          >
            {(["Administrativo", "Asistencial"] as const).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-slate-700">Cargo / Rol</span>
          <Input
            value={draft.cargo}
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, cargo: e.target.value } : prev))
            }
            placeholder="Ej: Enfermera, Auxiliar, Coordinador..."
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tipo de Documento</span>
          <Select
            value={(draft.candidato as any).tipo_doc ?? "CC"}
            onChange={(e) =>
              setDraft((prev) =>
                prev
                  ? {
                      ...prev,
                      candidato: { ...prev.candidato, tipo_doc: e.target.value } as any,
                    }
                  : prev
              )
            }
          >
            <option value="CC">Cédula de Ciudadanía (CC)</option>
            <option value="TI">Tarjeta de Identidad (TI)</option>
            <option value="CE">Cédula de Extranjería (CE)</option>
            <option value="RC">Registro Civil (RC)</option>
            <option value="PA">Pasaporte (PA)</option>
          </Select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Documento</span>
          <Input
            value={draft.candidato?.doc ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev ? { ...prev, candidato: { ...prev.candidato, doc: e.target.value } } : prev
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Nombres</span>
          <Input
            value={draft.candidato?.nombres ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, candidato: { ...prev.candidato, nombres: e.target.value } }
                  : prev
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Apellidos</span>
          <Input
            value={draft.candidato?.apellidos ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, candidato: { ...prev.candidato, apellidos: e.target.value } }
                  : prev
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Teléfono</span>
          <Input
            value={draft.candidato?.telefono ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, candidato: { ...prev.candidato, telefono: e.target.value } }
                  : prev
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Email</span>
          <Input
            value={draft.candidato?.email ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev ? { ...prev, candidato: { ...prev.candidato, email: e.target.value } } : prev
              )
            }
          />
        </label>

<label className="grid gap-1 text-sm">
  <span className="text-slate-700">Actividad</span>

  <Select
    value={draft.actividad || ""}
    onChange={(e) =>
      setDraft((prev) => (prev ? { ...prev, actividad: e.target.value } : prev))
    }
    disabled={actividadesLoading}
  >
    <option value="">
      {actividadesLoading ? "Cargando actividades..." : "Seleccione actividad"}
    </option>

    {/* Si la inscripción trae una actividad que ya no existe, la mostramos igual */}
    {!!draft.actividad &&
      !actividades.some((a) => actividadLabel(a) === draft.actividad) && (
        <option value={draft.actividad}>Actual: {draft.actividad}</option>
      )}

    {actividades.map((a) => {
      const label = actividadLabel(a);
      const cerrada = String(a.estado).toLowerCase() === "cerrada";
      return (
        <option key={a.id} value={label} disabled={cerrada}>
          {label}{cerrada ? " (Cerrada)" : ""}
        </option>
      );
    })}
  </Select>

  <div className="mt-2">
    <Button
      type="button"
      variant="outline"
      onClick={() => reloadActividades()}
      disabled={actividadesLoading}
    >
      {actividadesLoading ? "..." : "Recargar actividades"}
    </Button>
  </div>
</label>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-slate-700">Dirección</span>
          <Input
            value={draft.candidato?.direccion ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, candidato: { ...prev.candidato, direccion: e.target.value } }
                  : prev
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Ciudad</span>
          <Input
            value={draft.candidato?.ciudad ?? ""}
            onChange={(e) =>
              setDraft((prev) =>
                prev ? { ...prev, candidato: { ...prev.candidato, ciudad: e.target.value } } : prev
              )
            }
          />
        </label>
      </div>

      {/* ✅ DROPZONE PRO */}
      <div className="grid gap-3 mt-6">
        <div className="text-sm font-semibold">Adjuntos (PDF)</div>

        <DocumentDropzone
          value={adjNew}
          onChange={setAdjNew}
          maxFiles={10}
          maxSizeMB={10}
        />

        <div className="text-xs text-slate-500">
          Los adjuntos se registran en la inscripción. (En esta versión se guarda la lista/metadata; cuando quieras, lo conectamos a descarga real con storage).
        </div>

        {/* ✅ Adjuntos guardados (al editar) */}
        {adjSaved.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-[var(--subtle)] bg-white">
            <div className="border-b border-[var(--subtle)] px-3 py-2">
              <div className="text-sm font-semibold text-slate-800">Adjuntos guardados</div>
              <div className="text-xs text-slate-500">Estos ya estaban registrados en esta inscripción.</div>
            </div>

            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Archivo</th>
                  <th className="px-3 py-2 text-left">Tamaño</th>
                  <th className="w-24 px-3 py-2 text-left">—</th>
                </tr>
              </thead>
              <tbody>
                {adjSaved.map((a, idx) => (
                  <tr key={`${a.name}-${a.size}-${idx}`} className="border-b border-[var(--subtle)]/60 last:border-b-0">
                    <td className="px-3 py-2">{a.name}</td>
                    <td className="px-3 py-2">{(a.size / 1024).toFixed(1)} KB</td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => removeSaved(a.name, a.size)}
                      >
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
    </Section>
  );
}

/* ============== Paso 2: Evaluación ============== */
function PasoEvaluacion({
  draft,
  setDraft,
}: {
  draft: Inscripcion;
  setDraft: React.Dispatch<React.SetStateAction<Inscripcion | null>>;
}) {
  const ev = draft.evaluacion;

  return (
    <Section title="Evaluación del candidato" icon={<ShieldCheck size={18} />}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Puntaje (0–100)</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={ev.puntaje}
            onChange={(e) =>
              setDraft((prev) =>
                prev
                  ? {
                      ...prev,
                      evaluacion: {
                        ...prev.evaluacion,
                        puntaje: Math.max(0, Math.min(100, Number(e.target.value))),
                      },
                    }
                  : prev
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Decisión</span>
          <Select
            value={ev.decision || ""}
            onChange={(e) => {
              const decision = (e.target.value || undefined) as any;
              setDraft((prev) => {
                if (!prev) return prev;
                const next = {
                  ...prev,
                  evaluacion: { ...prev.evaluacion, decision },
                };
                // ✅ actualiza estado automáticamente sin dañar estados finales
                return { ...next, estado: computeEstadoFromDecision(next) };
              });
            }}
          >
            <option value="">Seleccione</option>
            <option value="Aprobar">Aprobar</option>
            <option value="Rechazar">Rechazar</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 mt-4 md:grid-cols-4">
        {[
          { key: "cv", label: "Hoja de vida (CV)" },
          { key: "doc", label: "Documento de identidad" },
          { key: "certificados", label: "Certificados laborales/estudio" },
          { key: "rut", label: "RUT (si aplica)" },
        ].map((k) => (
          <label key={k.key} className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={(ev.docsOk as any)[k.key]}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        evaluacion: {
                          ...prev.evaluacion,
                          docsOk: { ...prev.evaluacion.docsOk, [k.key]: e.target.checked },
                        },
                      }
                    : prev
                )
              }
            />
            <span>{k.label}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-1 mt-4 text-sm">
        <span className="text-slate-700">Concepto</span>
        <Textarea
          rows={3}
          value={ev.concepto}
          onChange={(e) =>
            setDraft((prev) => (prev ? { ...prev, evaluacion: { ...prev.evaluacion, concepto: e.target.value } } : prev))
          }
          placeholder="Resumen de entrevistas, verificación de referencias, etc."
        />
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Para <b>generar contrato</b>: Decisión = Aprobar, Puntaje ≥ 70 y CV/Documento/Certificados marcados como recibidos.
      </div>
    </Section>
  );
}

/* ============== Paso 3: Contrato ============== */
function PasoContrato({
  draft,
  setDraft,
}: {
  draft: Inscripcion;
  setDraft: React.Dispatch<React.SetStateAction<Inscripcion | null>>;
}) {
  const c =
    draft.contrato || {
      modalidad: "Prestación de servicios" as Modalidad,
      jornada: "Tiempo completo" as Jornada,
      salarioTipo: draft.tipo === "Administrativo" ? ("Salario" as const) : ("Honorarios" as const),
      valor: 0,
      periodo: "Mensual" as const,
      inicio: HOY,
      fin: "",
      descripcion: "",
    };

  const setC = (patch: Partial<NonNullable<Inscripcion["contrato"]>>) =>
    setDraft((prev) => (prev ? { ...prev, contrato: { ...c, ...patch } } : prev));

  return (
    <Section title="Definición del contrato" icon={<FileSignature size={18} />}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Modalidad</span>
          <Select value={c.modalidad} onChange={(e) => setC({ modalidad: e.target.value as Modalidad })}>
            {(["Prestación de servicios", "Temporal", "Indefinido"] as const).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Jornada</span>
          <Select value={c.jornada} onChange={(e) => setC({ jornada: e.target.value as Jornada })}>
            {(["Tiempo completo", "Medio tiempo", "Por horas"] as const).map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tipo de remuneración</span>
          <Select value={c.salarioTipo} onChange={(e) => setC({ salarioTipo: e.target.value as any })}>
            <option>Salario</option>
            <option>Honorarios</option>
          </Select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">{c.salarioTipo}</span>
          <Input type="number" min={0} value={c.valor} onChange={(e) => setC({ valor: Number(e.target.value) })} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Periodo</span>
          <Select value={c.periodo} onChange={(e) => setC({ periodo: e.target.value as any })}>
            <option>Mensual</option>
            <option>Quincenal</option>
            <option>Por servicio</option>
          </Select>
        </label>

        <div />

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Fecha de inicio</span>
          <Input type="date" value={c.inicio} onChange={(e) => setC({ inicio: e.target.value })} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">
            Fecha de fin {c.modalidad === "Temporal" ? "(requerida)" : "(opcional)"}
          </span>
          <Input type="date" value={c.fin || ""} onChange={(e) => setC({ fin: e.target.value })} />
        </label>

        <label className="grid gap-1 text-sm md:col-span-3">
          <span className="text-slate-700">Descripción/Objeto</span>
          <Textarea
            rows={3}
            value={c.descripcion || ""}
            onChange={(e) => setC({ descripcion: e.target.value })}
            placeholder={`Prestación de servicios como ${draft.cargo} en el marco de ${draft.actividad}.`}
          />
        </label>
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Resumen: <b>{c.modalidad}</b>, <b>{c.jornada}</b>, {String(c.salarioTipo).toLowerCase()} de <b>{money(c.valor)}</b>{" "}
        ({String(c.periodo).toLowerCase()}). {c.inicio}
        {c.fin ? ` → ${c.fin}` : ""}.
      </div>
    </Section>
  );
}

/* ============== Paso 4: Previsualización ============== */
function PasoPreview({ draft }: { draft: Inscripcion }) {
  const contratoTxt = renderContrato(draft);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contratoTxt);
      toast.success("Contrato copiado.");
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  const download = () => {
    const blob = new Blob([contratoTxt], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft.radicado || "INS"}_contrato.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const printDoc = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<pre style="font-family: ui-sans-serif, system-ui, -apple-system; white-space: pre-wrap; line-height:1.4; padding:16px;">${contratoTxt.replace(
        /</g,
        "&lt;"
      )}</pre>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Section
      title="Previsualización del contrato"
      icon={<Briefcase size={18} />}
      actions={
        <>
          <Button variant="outline" onClick={copy}>
            <Copy size={16} /> Copiar
          </Button>
          <Button variant="outline" onClick={download}>
            <FileDown size={16} /> Descargar .doc
          </Button>
          <Button onClick={printDoc}>
            <Printer size={16} /> Imprimir
          </Button>
        </>
      }
    >
      <div className="rounded border border-[var(--subtle)] bg-white p-4 text-sm leading-6" style={{ maxHeight: 420, overflow: "auto" }}>
        <pre className="font-sans whitespace-pre-wrap">{contratoTxt}</pre>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        * Formato de texto plano para exportar a Word/PDF. En una fase posterior podremos generar PDF con tu identidad visual.
      </div>
    </Section>
  );
}

/* ============== Plantilla de contrato (texto) ============== */
function renderContrato(r: Inscripcion) {
  const c = r.contrato!;
  const nom = `${r.candidato.nombres} ${r.candidato.apellidos}`.trim();
  const objeto = c.descripcion?.trim() || `Prestación de servicios como ${r.cargo} en el marco de ${r.actividad}.`;

  return `
CONTRATO DE ${String(c.modalidad).toUpperCase()} No. ${r.radicado || "SIN RADICADO"}

Entre CEBMAG, quien para efectos del presente contrato se denominará “LA CONTRATANTE”, y ${nom}, mayor de edad, identificado(a) con documento No. ${r.candidato.doc}, quien en adelante se denominará “EL(LA) CONTRATISTA”, se celebra el presente contrato conforme a las siguientes cláusulas:

PRIMERA – OBJETO: ${objeto}

SEGUNDA – PLAZO: El contrato tendrá vigencia desde el ${fmtFecha(c.inicio)} ${
    c.fin ? `hasta el ${fmtFecha(c.fin)}` : "y hasta la terminación por cumplimiento del objeto o decisión de las partes"
  }.

TERCERA – VALOR Y FORMA DE PAGO: ${c.salarioTipo} por ${money(c.valor)} (${String(c.periodo).toLowerCase()}). Los pagos estarán condicionados a la entrega de actividades e informes aprobados por LA CONTRATANTE.

CUARTA – JORNADA Y LUGAR: ${c.jornada}. Las actividades se desarrollarán según programación de ${r.actividad} y lineamientos de CEBMAG.

QUINTA – OBLIGACIONES DEL(LA) CONTRATISTA:
  a) Cumplir cabalmente con el objeto contratado.
  b) Observar protocolos y normas internas de CEBMAG.
  c) Mantener reserva sobre la información a la que tenga acceso.
  d) Entregar productos e informes en los plazos establecidos.

SEXTA – SUPERVISIÓN: CEBMAG designará un supervisor para verificar el cumplimiento del objeto y autorizar pagos.

SÉPTIMA – CONFIDENCIALIDAD Y DATOS: El(la) CONTRATISTA se obliga a proteger la información de carácter reservado y los datos personales de beneficiarios y terceros conforme a la ley.

OCTAVA – TERMINACIÓN: El contrato podrá darse por terminado por mutuo acuerdo, por incumplimiento o por finalización del objeto.

NOVENA – INHABILIDADES E INCOMPATIBILIDADES: El(la) CONTRATISTA declara bajo gravedad de juramento no encontrarse incurso(a) en inhabilidades o incompatibilidades para contratar.

En constancia se firma en la ciudad de ____________________, a los ____ días del mes de __________ de ______.

LA CONTRATANTE: CEBMAG
EL(LA) CONTRATISTA: ${nom}
  `.trim();
}

function fmtFecha(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}
"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  Plus, Search, User, ClipboardList, ShieldCheck, FileSignature, Briefcase, Building2, Calendar,
  DollarSign, Upload, X, Pencil, Trash2, CheckCircle2, XCircle, Copy, Printer, FileDown,
} from "lucide-react";

/* ============== Helpers UI ============== */
function Button({
  children, variant = "solid", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
  const styles =
    variant === "solid" ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline" ? "border border-[var(--subtle)] hover:bg-white"
      : "hover:bg-white";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`} />;
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
function Modal({ open, onClose, title, actions, wide, children }: {
  open: boolean; onClose: () => void; title: string; actions?: React.ReactNode; wide?: boolean; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`absolute left-1/2 top-1/2 ${wide ? "w-[min(980px,96vw)]" : "w-[min(720px,92vw)]"} -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl`}>
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

/* ============== Tipos y mock ============== */
type Estado = "En evaluación" | "Aprobada" | "Rechazada" | "Contrato generado" | "Firmado";
type TipoPersonal = "Administrativo" | "Asistencial";
type Modalidad = "Prestación de servicios" | "Temporal" | "Indefinido";
type Jornada = "Tiempo completo" | "Medio tiempo" | "Por horas";

type Inscripcion = {
  id: string;
  radicado: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoPersonal;
  candidato: { doc: string; nombres: string; apellidos: string; telefono?: string; email?: string; direccion?: string; ciudad?: string };
  cargo: string;
  actividad: string; // A1..A8 texto
  estado: Estado;
  evaluacion: { puntaje: number; docsOk: { cv: boolean; doc: boolean; certificados: boolean; rut: boolean }; concepto: string; decision?: "Aprobar" | "Rechazar" };
  contrato?: {
    modalidad: Modalidad;
    jornada: Jornada;
    salarioTipo: "Salario" | "Honorarios";
    valor: number;
    periodo: "Mensual" | "Quincenal" | "Por servicio";
    inicio: string;
    fin?: string;
    descripcion?: string;
  };
  adjuntos: { name: string; size: number }[];
};

const HOY = new Date().toISOString().slice(0, 10);
const MOCK: Inscripcion[] = [
  {
    id: crypto.randomUUID(),
    radicado: "INS-2025-0001",
    fecha: HOY,
    tipo: "Asistencial",
    candidato: { doc: "1010", nombres: "Laura", apellidos: "Quintero", telefono: "3000000000", email: "laura@ejemplo.com" },
    cargo: "Enfermera jefe",
    actividad: "A4 • Actividad 4",
    estado: "En evaluación",
    evaluacion: { puntaje: 78, docsOk: { cv: true, doc: true, certificados: true, rut: false }, concepto: "Perfil adecuado, falta RUT" },
    adjuntos: [],
  },
];

/* ============== Utilidades ============== */
const actividades = [
  "A1 • Actividad 1",
  "A2 • Actividad 2",
  "A3 • Actividad 3",
  "A4 • Actividad 4",
  "A5 • Actividad 5",
  "A6 • Actividad 6",
  "A7 • Actividad 7",
  "A8 • Actividad 8",
];
const nextRadicado = (n: number) => `INS-2025-${String(n + 1).padStart(4, "0")}`;
const canGenerateContract = (r: Inscripcion) =>
  r.evaluacion.decision === "Aprobar" &&
  r.evaluacion.puntaje >= 70 &&
  r.evaluacion.docsOk.cv && r.evaluacion.docsOk.doc && r.evaluacion.docsOk.certificados;

/* ============== Página principal ============== */
export default function InscripcionesPage() {
  const title = "Inscripciones y contratos";
  const [rows, setRows] = useState<Inscripcion[]>(MOCK);
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState<"" | Estado>("");
  const [fTipo, setFTipo] = useState<"" | TipoPersonal>("");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Inscripcion | null>(null);
  const [step, setStep] = useState(1);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ =
        !t ||
        [r.radicado, r.candidato.nombres, r.candidato.apellidos, r.candidato.doc, r.cargo, r.actividad]
          .join(" ")
          .toLowerCase()
          .includes(t);
      const okE = !fEstado || r.estado === fEstado;
      const okT = !fTipo || r.tipo === fTipo;
      return okQ && okE && okT;
    });
  }, [rows, q, fEstado, fTipo]);

  const nueva = () => {
    const d: Inscripcion = {
      id: crypto.randomUUID(),
      radicado: nextRadicado(rows.length),
      fecha: HOY,
      tipo: "Asistencial",
      candidato: { doc: "", nombres: "", apellidos: "", telefono: "", email: "", direccion: "", ciudad: "" },
      cargo: "",
      actividad: actividades[0],
      estado: "En evaluación",
      evaluacion: { puntaje: 0, docsOk: { cv: false, doc: false, certificados: false, rut: false }, concepto: "" },
      adjuntos: [],
    };
    setDraft(d);
    setStep(1);
    setOpen(true);
  };
  const editar = (r: Inscripcion) => {
    setDraft(JSON.parse(JSON.stringify(r)));
    setStep(1);
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
  const generarContrato = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      estado: "Contrato generado",
    });
  };
  const marcarFirmado = (r: Inscripcion) =>
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, estado: "Firmado" } : x)));

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6">
        <Section
          title="Listado de inscripciones"
          icon={<ClipboardList size={18} />}
          actions={
            <>
              <div className="hidden md:flex items-center gap-2">
                <Input placeholder="Buscar por nombre, cargo, radicado…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
                <Select value={fTipo} onChange={(e) => setFTipo(e.target.value as TipoPersonal | "")}>
                  <option value="">Tipo: Todos</option>
                  {(["Administrativo", "Asistencial"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Select value={fEstado} onChange={(e) => setFEstado(e.target.value as Estado | "")}>
                  <option value="">Estado: Todos</option>
                  {(["En evaluación","Aprobada","Rechazada","Contrato generado","Firmado"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <Button onClick={nueva}><Plus size={16} /> Nueva inscripción</Button>
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                  <th className="text-left py-2 pl-4 pr-3">Radicado</th>
                  <th className="text-left py-2 px-3">Fecha</th>
                  <th className="text-left py-2 px-3">Tipo</th>
                  <th className="text-left py-2 px-3">Candidato</th>
                  <th className="text-left py-2 px-3">Cargo</th>
                  <th className="text-left py-2 px-3">Actividad</th>
                  <th className="text-left py-2 px-3">Estado</th>
                  <th className="text-left py-2 px-3 w-[320px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--subtle)]/70">
                    <td className="py-2 pl-4 pr-3 font-medium">{r.radicado}</td>
                    <td className="py-2 px-3">{r.fecha}</td>
                    <td className="py-2 px-3">{r.tipo}</td>
                    <td className="py-2 px-3">{r.candidato.nombres} {r.candidato.apellidos} <span className="text-slate-500">({r.candidato.doc || "s/d"})</span></td>
                    <td className="py-2 px-3">{r.cargo || "—"}</td>
                    <td className="py-2 px-3">{r.actividad}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[12px] rounded-full border px-2 py-0.5 ${r.estado === "Firmado"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : r.estado === "Contrato generado"
                        ? "bg-sky-100 text-sky-700 border-sky-200"
                        : r.estado === "Aprobada"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : r.estado === "Rechazada"
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => editar(r)}><Pencil size={14} /> Abrir</Button>
                        {r.estado === "Contrato generado" && (
                          <Button variant="outline" onClick={() => marcarFirmado(r)}><CheckCircle2 size={14} /> Marcar firmado</Button>
                        )}
                        <Button variant="ghost" onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}>
                          <Trash2 size={14} /> Quitar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sin resultados.</td></tr>
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
      />
    </DashboardShell>
  );
}

/* ============== Wizard Modal ============== */
function WizardModal({
  open, setOpen, draft, setDraft, step, setStep, onSave, onGenerate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: Inscripcion | null;
  setDraft: (v: Inscripcion | null) => void;
  step: number;
  setStep: (n: number) => void;
  onSave: () => void;
  onGenerate: () => void;
}) {
  if (!draft) return null;

  const next = () => setStep(Math.min(4, step + 1));
  const prev = () => setStep(Math.max(1, step - 1));

  const validStep1 =
    !!draft.candidato.nombres && !!draft.candidato.apellidos && !!draft.candidato.doc && !!draft.cargo && !!draft.actividad;

  const validStep2 =
    (draft.evaluacion.decision === "Aprobar" || draft.evaluacion.decision === "Rechazar") &&
    (draft.evaluacion.decision === "Rechazar" || draft.evaluacion.puntaje >= 0);

  const hasContrato = !!draft.contrato;
  const validContrato =
    hasContrato &&
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
      title={`Inscripción — ${draft.radicado}`}
      wide
      actions={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cerrar</Button>
          {step > 1 && <Button variant="outline" onClick={prev}>Atrás</Button>}
          {step < 4 && <Button onClick={next} disabled={(step === 1 && !validStep1) || (step === 2 && !validStep2) || (step === 3 && !validContrato)}>
            Siguiente
          </Button>}
          {step === 4 && (
            <>
              <Button variant="outline" onClick={onSave}><FileDown size={16} /> Guardar</Button>
              <Button onClick={onGenerate} disabled={!canGen}><FileSignature size={16} /> Generar contrato</Button>
            </>
          )}
        </>
      }
    >
      <Stepper step={step} />
      {step === 1 && <PasoDatos draft={draft} setDraft={setDraft} />}
      {step === 2 && <PasoEvaluacion draft={draft} setDraft={setDraft} />}
      {step === 3 && <PasoContrato draft={draft} setDraft={setDraft} />}
      {step === 4 && <PasoPreview draft={draft} />}
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
        <div key={it.n} className="flex-1 flex items-center gap-2">
          <div className={`flex items-center gap-2 ${idx > 0 ? "w-full" : ""}`}>
            {idx > 0 && <div className={`h-[2px] flex-1 rounded ${step > it.n ? "bg-[var(--brand)]" : "bg-slate-200"}`} />}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] border
              ${step >= it.n ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white text-slate-600 border-[var(--subtle)]"}`}>
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
function PasoDatos({ draft, setDraft }: { draft: Inscripcion; setDraft: (v: Inscripcion) => void }) {
  return (
    <Section title="Datos del candidato" icon={<User size={18} />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tipo de personal</span>
          <Select value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value as any })}>
            {(["Administrativo", "Asistencial"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-slate-700">Cargo / Rol</span>
          <Input value={draft.cargo} onChange={(e) => setDraft({ ...draft, cargo: e.target.value })} placeholder="Ej: Enfermera, Auxiliar, Coordinador..." />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tipo de Documento</span>
              <Select name="tipo_doc" defaultValue="CC">
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="RC">Registro Civil (RC)</option>
                <option value="PA">Pasaporte (PA)</option>
              </Select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Documento</span>
          <Input value={draft.candidato.doc} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, doc: e.target.value } })} placeholder="CC/CE/TI" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Nombres</span>
          <Input value={draft.candidato.nombres} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, nombres: e.target.value } })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Apellidos</span>
          <Input value={draft.candidato.apellidos} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, apellidos: e.target.value } })} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Teléfono</span>
          <Input value={draft.candidato.telefono || ""} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, telefono: e.target.value } })} placeholder="300 000 0000" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Email</span>
          <Input value={draft.candidato.email || ""} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, email: e.target.value } })} placeholder="correo@dominio.com" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Actividad</span>
          <Select value={draft.actividad} onChange={(e) => setDraft({ ...draft, actividad: e.target.value })}>
            {actividades.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </label>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-slate-700">Dirección</span>
          <Input value={draft.candidato.direccion || ""} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, direccion: e.target.value } })} placeholder="Calle 00 # 00-00" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Ciudad</span>
          <Input value={draft.candidato.ciudad || ""} onChange={(e) => setDraft({ ...draft, candidato: { ...draft.candidato, ciudad: e.target.value } })} placeholder="Ciudad/Municipio" />
        </label>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="text-sm font-semibold">Adjuntos (PDF/otros)</div>
        <input
          type="file"
          multiple
          onChange={(e) => {
            if (!e.target.files) return;
            const arr = Array.from(e.target.files).map((f) => ({ name: f.name, size: f.size }));
            setDraft({ ...draft, adjuntos: [...draft.adjuntos, ...arr] });
          }}
        />
        {draft.adjuntos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr><th className="text-left py-2 px-3">Archivo</th><th className="text-left py-2 px-3">Tamaño</th><th className="text-left py-2 px-3 w-24">—</th></tr>
              </thead>
              <tbody>
                {draft.adjuntos.map((a) => (
                  <tr key={a.name} className="border-b border-[var(--subtle)]/60">
                    <td className="py-2 px-3">{a.name}</td>
                    <td className="py-2 px-3">{(a.size/1024).toFixed(1)} KB</td>
                    <td className="py-2 px-3">
                      <Button variant="ghost" onClick={() => setDraft({ ...draft, adjuntos: draft.adjuntos.filter((x) => x.name !== a.name) })}>
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
function PasoEvaluacion({ draft, setDraft }: { draft: Inscripcion; setDraft: (v: Inscripcion) => void }) {
  const ev = draft.evaluacion;
  return (
    <Section title="Evaluación del candidato" icon={<ShieldCheck size={18} />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Puntaje (0–100)</span>
          <Input type="number" min={0} max={100} value={ev.puntaje} onChange={(e) => setDraft({ ...draft, evaluacion: { ...ev, puntaje: Math.max(0, Math.min(100, Number(e.target.value))) } })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Decisión</span>
          <Select value={ev.decision || ""} onChange={(e) => setDraft({ ...draft, evaluacion: { ...ev, decision: e.target.value as any } })}>
            <option value="">Seleccione</option>
            <option value="Aprobar">Aprobar</option>
            <option value="Rechazar">Rechazar</option>
          </Select>
        </label>
      </div>

      <div className="mt-4 grid md:grid-cols-4 gap-3">
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
              onChange={(e) => setDraft({ ...draft, evaluacion: { ...ev, docsOk: { ...ev.docsOk, [k.key]: e.target.checked } } })}
            />
            <span>{k.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-1 text-sm">
        <span className="text-slate-700">Concepto</span>
        <Textarea rows={3} value={ev.concepto} onChange={(e) => setDraft({ ...draft, evaluacion: { ...ev, concepto: e.target.value } })} placeholder="Resumen de entrevistas, verificación de referencias, etc." />
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Para **generar contrato**: Decisión = Aprobar, Puntaje ≥ 70 y CV/Documento/Certificados marcados como recibidos.
      </div>
    </Section>
  );
}

/* ============== Paso 3: Contrato ============== */
function PasoContrato({ draft, setDraft }: { draft: Inscripcion; setDraft: (v: Inscripcion) => void }) {
  const c = draft.contrato || {
    modalidad: "Prestación de servicios" as Modalidad,
    jornada: "Tiempo completo" as Jornada,
    salarioTipo: draft.tipo === "Administrativo" ? "Salario" : "Honorarios",
    valor: 0,
    periodo: "Mensual" as const,
    inicio: HOY,
    fin: "",
    descripcion: "",
  };
  const setC = (patch: Partial<NonNullable<Inscripcion["contrato"]>>) => setDraft({ ...draft, contrato: { ...c, ...patch } });
  return (
    <Section title="Definición del contrato" icon={<FileSignature size={18} />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Modalidad</span>
          <Select value={c.modalidad} onChange={(e) => setC({ modalidad: e.target.value as Modalidad })}>
            {(["Prestación de servicios", "Temporal", "Indefinido"] as const).map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Jornada</span>
          <Select value={c.jornada} onChange={(e) => setC({ jornada: e.target.value as Jornada })}>
            {(["Tiempo completo","Medio tiempo","Por horas"] as const).map((j) => <option key={j} value={j}>{j}</option>)}
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
          <Input type="number" min={0} value={c.valor} onChange={(e) => setC({ valor: Number(e.target.value) })} placeholder="0" />
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
          <span className="text-slate-700">Fecha de fin {c.modalidad === "Temporal" ? "(requerida)" : "(opcional)"}</span>
          <Input type="date" value={c.fin || ""} onChange={(e) => setC({ fin: e.target.value })} />
        </label>

        <label className="grid gap-1 text-sm md:col-span-3">
          <span className="text-slate-700">Descripción/Objeto</span>
          <Textarea rows={3} value={c.descripcion || ""} onChange={(e) => setC({ descripcion: e.target.value })} placeholder={`Prestación de servicios como ${draft.cargo} en el marco de ${draft.actividad}.`} />
        </label>
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Resumen: <b>{c.modalidad}</b>, <b>{c.jornada}</b>, {c.salarioTipo.toLowerCase()} de <b>{money(c.valor)}</b> ({c.periodo}). {c.inicio}{c.fin ? ` → ${c.fin}` : ""}.
      </div>
    </Section>
  );
}

/* ============== Paso 4: Previsualización ============== */
function PasoPreview({ draft }: { draft: Inscripcion }) {
  const contratoTxt = renderContrato(draft);
  const copy = async () => { try { await navigator.clipboard.writeText(contratoTxt); alert("Contrato copiado."); } catch {} };
  const download = () => {
    const blob = new Blob([contratoTxt], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft.radicado}_contrato.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const printDoc = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<pre style="font-family: ui-sans-serif, system-ui, -apple-system; white-space: pre-wrap; line-height:1.4; padding:16px;">${contratoTxt.replace(/</g,"&lt;")}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Section title="Previsualización del contrato" icon={<Briefcase size={18} />} actions={
      <>
        <Button variant="outline" onClick={copy}><Copy size={16} /> Copiar</Button>
        <Button variant="outline" onClick={download}><FileDown size={16} /> Descargar .doc</Button>
        <Button onClick={printDoc}><Printer size={16} /> Imprimir</Button>
      </>
    }>
      <div className="rounded border border-[var(--subtle)] bg-white p-4 text-sm leading-6" style={{ maxHeight: 420, overflow: "auto" }}>
        <pre className="whitespace-pre-wrap font-sans">{contratoTxt}</pre>
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
CONTRATO DE ${c.modalidad.toUpperCase()} No. ${r.radicado}

Entre CEBMAG, quien para efectos del presente contrato se denominará “LA CONTRATANTE”, y ${nom}, mayor de edad, identificado(a) con documento No. ${r.candidato.doc}, quien en adelante se denominará “EL(LA) CONTRATISTA”, se celebra el presente contrato conforme a las siguientes cláusulas:

PRIMERA – OBJETO: ${objeto}

SEGUNDA – PLAZO: El contrato tendrá vigencia desde el ${fmtFecha(c.inicio)} ${c.fin ? `hasta el ${fmtFecha(c.fin)}` : "y hasta la terminación por cumplimiento del objeto o decisión de las partes"}.

TERCERA – VALOR Y FORMA DE PAGO: ${c.salarioTipo} por ${money(c.valor)} (${c.periodo.toLowerCase()}). Los pagos estarán condicionados a la entrega de actividades e informes aprobados por LA CONTRATANTE.

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
  } catch { return iso; }
}

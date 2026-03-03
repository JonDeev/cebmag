"use client";

import React, { useRef, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  IdCard,
  Stethoscope,
  Palette,
  PhoneCall,
  UserPlus,
  Upload,
  Trash2,
  Plus,
  Search,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import DocumentDropzone from "@/components/files/DocumentDropzone";

/* ---------- UI helpers (inputs básicos) ---------- */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}

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
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`${base} ${styles} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* ---------- Tipos ---------- */
type Acudiente = {
  _key: number;
  nombre: string;
  parentesco: string;
  telefono: string;
  direccion: string;
};

type DocMeta = { nombre?: string; name?: string; size?: number; tipo?: string };

const toInputDate = (v: any) => {
  if (!v) return "";
  const s = typeof v === "string" ? v : new Date(v).toISOString();
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const sexoToUi = (v: any) => {
  if (!v) return "";
  const s = String(v).toUpperCase();
  if (s === "FEMENINO") return "Femenino";
  if (s === "MASCULINO") return "Masculino";
  if (s === "OTRO") return "Otro / Prefiere no decir";
  return String(v);
};

const zonaToUi = (v: any) => {
  if (!v) return "Urbana";
  const s = String(v).toUpperCase();
  if (s === "URBANA") return "Urbana";
  if (s === "RURAL") return "Rural";
  return String(v);
};

const rhToUi = (v: any) => {
  if (!v) return "";
  const s = String(v).toUpperCase();
  const map: Record<string, string> = {
    O_POS: "O+",
    O_NEG: "O-",
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
  };
  return map[s] ?? String(v);
};

const discapacidadToUi = (v: any) => {
  if (!v) return "";
  const s = String(v).toUpperCase();
  const map: Record<string, string> = {
    NINGUNA: "",
    VISUAL: "Visual",
    AUDITIVA: "Auditiva",
    MOTORA: "Motora",
    COGNITIVA: "Cognitiva",
    OTRA: "Otra",
  };
  return map[s] ?? String(v);
};

/* ---------- Motion Section ---------- */
function MotionSection({
  icon,
  title,
  children,
  reduceMotion,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 260, damping: 28 }
      }
      className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--subtle)] px-4 py-3">
        <div className="text-[var(--brand)]">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid gap-4 p-4">{children}</div>
    </motion.div>
  );
}

function formatKB(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ---------- Página ---------- */
export default function BeneficiariosPage() {
  const title = "Beneficiarios";
  const reduceMotionPref = useReducedMotion();
  const reduceMotion = !!reduceMotionPref;

  const [currentId, setCurrentId] = useState<number | null>(null);

  // ✅ Separación correcta:
  // docsNew: archivos seleccionados (File[]) que se suben al guardar
  // docsSaved: metadata guardada en BD (viene en buscar)
  const [docsNew, setDocsNew] = useState<File[]>([]);
  const [docsSaved, setDocsSaved] = useState<DocMeta[]>([]);

  // Lista de acudientes (dinámica)
  const acudKeyRef = useRef(1);
  const mkAcudiente = (): Acudiente => ({
    _key: acudKeyRef.current++,
    nombre: "",
    parentesco: "",
    telefono: "",
    direccion: "",
  });

  const [acudientes, setAcudientes] = useState<Acudiente[]>([mkAcudiente()]);
  const addAcudiente = () => setAcudientes((a) => [...a, mkAcudiente()]);
  const removeAcudiente = (idx: number) =>
    setAcudientes((a) => a.filter((_, i) => i !== idx));
  const patchAcudiente = (idx: number, patch: Partial<Acudiente>) =>
    setAcudientes((a) => a.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  const limpiar = () => {
    setCurrentId(null);
    setDocsNew([]);
    setDocsSaved([]);
    setAcudientes([mkAcudiente()]);

    const form = document.getElementById("benef-form") as HTMLFormElement | null;
    form?.reset();

    const idEl = form?.querySelector("[name='id']") as HTMLInputElement | null;
    if (idEl) idEl.value = "";
  };

  const buscar = async () => {
    const tipo = (document.querySelector("[name='tipo_doc']") as HTMLSelectElement)?.value;
    const doc = (document.querySelector("[name='num_doc']") as HTMLInputElement)?.value;

    if (!tipo || !doc) {
      toast.error("Ingrese tipo y número de documento para buscar.");
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `/api/beneficiarios/buscar?tipo=${encodeURIComponent(tipo)}&doc=${encodeURIComponent(doc)}`
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Error al buscar beneficiario.");
      }
      const data = await res.json();

      if (!data) {
        toast("No se encontró ningún beneficiario con esos datos.");
        return;
      }

      const idFound = typeof data.id === "number" ? data.id : Number(data.id);
      const finalId = Number.isFinite(idFound) && idFound > 0 ? idFound : null;
      setCurrentId(finalId);

      const form = document.getElementById("benef-form") as HTMLFormElement | null;
      if (!form) return;

      const fill = (name: string, val?: any) => {
        const el = form.querySelector(`[name='${name}']`) as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
          | null;
        if (!el) return;
        if (val === undefined || val === null) return;
        el.value = String(val);
      };

      fill("id", finalId ?? "");
      fill("tipo_doc", data.tipo_doc ?? data.tipoDoc ?? tipo);
      fill("num_doc", data.num_doc ?? data.doc ?? doc);
      fill("fecha_nac", toInputDate(data.fecha_nac ?? data.fechaNacimiento));
      fill("nombres", data.nombres ?? "");
      fill("apellidos", data.apellidos ?? "");

      fill("sexo", sexoToUi(data.sexo));
      fill("direccion", data.direccion ?? "");
      fill("barrio", data.barrio ?? "");
      fill("ciudad", data.ciudad ?? "");
      fill("dpto", data.dpto ?? data.departamento ?? "");
      fill("zona", zonaToUi(data.zona));

      fill("telefono", data.telefono ?? "");
      fill("eps", data.eps ?? "");
      fill("rh", rhToUi(data.rh));
      fill("discapacidad", discapacidadToUi(data.discapacidad));

      fill("alergias", data.alergias ?? "");
      fill("medicamentos", data.medicamentos ?? "");
      fill("antecedentes", data.antecedentes ?? "");

      fill("comunidad", data.comunidad ?? "");
      fill("lengua", data.lengua ?? "");
      fill("practicas", data.practicas ?? data.practicasCulturales ?? "");

      fill("urg_nombre", data.urg_nombre ?? data.urgenciaNombre ?? "");
      fill("urg_parentesco", data.urg_parentesco ?? data.urgenciaParentesco ?? "");
      fill("urg_tel", data.urg_tel ?? data.urgenciaTelefono ?? "");
      fill("urg_dir", data.urg_dir ?? data.urgenciaDireccion ?? "");

      const acud = data.acudientes ?? data.acudiente ?? null;
      if (Array.isArray(acud) && acud.length) {
        setAcudientes(
          acud.map((x: any) => ({
            _key: acudKeyRef.current++,
            nombre: x.nombre ?? "",
            parentesco: x.parentesco ?? "",
            telefono: x.telefono ?? "",
            direccion: x.direccion ?? "",
          }))
        );
      } else {
        setAcudientes([mkAcudiente()]);
      }

      // ✅ Docs guardados en BD (metadata) + limpiar nuevos
      setDocsSaved(Array.isArray(data.docs) ? data.docs : []);
      setDocsNew([]);

      toast.success("Beneficiario encontrado ✅");
    } catch (e: any) {
      toast.error("Error: " + (e?.message ?? "Desconocido"));
    } finally {
      setSearching(false);
    }
  };

  const getPayloadFromForm = () => {
    const form = document.getElementById("benef-form") as HTMLFormElement | null;
    if (!form) return null;

    const fd = new FormData(form);
    const idRaw = fd.get("id");
    const parsed = idRaw === null ? NaN : Number(String(idRaw).trim());
    const id = currentId ?? (Number.isFinite(parsed) ? parsed : null);

    // ✅ merge docsSaved + docsNew (metadata) sin duplicados
    const saved = docsSaved.map((d) => ({
      nombre: d.nombre ?? d.name ?? "PDF",
      tipo: d.tipo ?? "PDF",
      size: Number(d.size ?? 0),
    }));

    const news = docsNew.map((f) => ({
      nombre: f.name,
      tipo: "PDF",
      size: f.size,
    }));

    const seen = new Set<string>();
    const mergedDocs = [...saved, ...news].filter((x) => {
      const k = `${x.nombre}__${x.size}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      ...(id && id > 0 ? { id } : {}),

      tipo_doc: fd.get("tipo_doc"),
      num_doc: fd.get("num_doc"),
      fecha_nac: fd.get("fecha_nac"),
      nombres: fd.get("nombres"),
      apellidos: fd.get("apellidos"),
      sexo: fd.get("sexo"),
      direccion: fd.get("direccion"),
      barrio: fd.get("barrio"),
      ciudad: fd.get("ciudad"),
      dpto: fd.get("dpto"),
      zona: fd.get("zona"),
      telefono: fd.get("telefono"),

      eps: fd.get("eps"),
      rh: fd.get("rh"),
      discapacidad: fd.get("discapacidad"),
      alergias: fd.get("alergias"),
      medicamentos: fd.get("medicamentos"),
      antecedentes: fd.get("antecedentes"),

      comunidad: fd.get("comunidad"),
      lengua: fd.get("lengua"),
      practicas: fd.get("practicas"),

      urg_nombre: fd.get("urg_nombre"),
      urg_parentesco: fd.get("urg_parentesco"),
      urg_tel: fd.get("urg_tel"),
      urg_dir: fd.get("urg_dir"),

      acudientes: acudientes.map(({ _key, ...rest }) => rest),

      docs: mergedDocs,
    };
  };

  const guardar = async () => {
    const payload = getPayloadFromForm();
    if (!payload) return;

    const { id, ...createPayload } = payload as any;

    if (!createPayload.num_doc || !createPayload.nombres || !createPayload.apellidos) {
      toast.error("Faltan campos obligatorios: documento, nombres y apellidos.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/beneficiarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Error: " + (j.error ?? res.statusText));
        return;
      }

      toast.success("Guardado ✅");
      limpiar();
    } catch (e: any) {
      toast.error("Error de red: " + (e?.message ?? "Desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const actualizar = async () => {
    const payload = getPayloadFromForm();
    if (!payload) return;

    if (!payload.tipo_doc || !payload.num_doc) {
      toast.error("Para actualizar debes indicar Tipo y Número de documento.");
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch("/api/beneficiarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Error: " + (j.error ?? res.statusText));
        return;
      }

      toast.success(`Actualizado ✅ Última actualización: ${j.updatedAt ?? "ok"}`);

      // ✅ al actualizar, considera que los "nuevos" ya quedan guardados como meta
      // (como aún no subimos el archivo real en Opción A, es solo metadata)
      setDocsSaved((prev) => {
        const saved = prev.map((d) => ({
          nombre: d.nombre ?? d.name ?? "PDF",
          tipo: d.tipo ?? "PDF",
          size: Number(d.size ?? 0),
        }));
        const news = docsNew.map((f) => ({ nombre: f.name, tipo: "PDF", size: f.size }));
        const seen = new Set<string>();
        const merged = [...saved, ...news].filter((x) => {
          const k = `${x.nombre}__${x.size}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        return merged;
      });
      setDocsNew([]);
    } catch (e: any) {
      toast.error("Error de red: " + (e?.message ?? "Desconocido"));
    } finally {
      setUpdating(false);
    }
  };

  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: reduceMotion ? { duration: 0 } : { staggerChildren: 0.06, delayChildren: 0.02 },
    },
  };

  return (
    <DashboardShell title={title}>
      <motion.form
        id="benef-form"
        className="grid gap-6"
        onSubmit={(e) => e.preventDefault()}
        variants={container}
        initial="hidden"
        animate="show"
        layout
      >
        <input type="hidden" name="id" defaultValue="" />

        {/* Barra de acciones (animada) */}
        <motion.div
          layout
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="flex items-center justify-end gap-2"
        >
          <Button type="button" variant="ghost" onClick={limpiar}>
            Limpiar
          </Button>
          <Button type="button" variant="outline" onClick={actualizar} disabled={updating}>
            <Pencil size={16} />
            {updating ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button type="button" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </motion.div>

        {/* i) Identificación y Ubicación */}
        <MotionSection icon={<IdCard size={18} />} title="Datos de identificación y ubicación" reduceMotion={reduceMotion}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Tipo de documento">
              <Select name="tipo_doc" defaultValue="CC">
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="RC">Registro Civil (RC)</option>
                <option value="PA">Pasaporte (PA)</option>
              </Select>
            </Field>

            <Field label="Número de documento">
              <div className="flex gap-2">
                <Input name="num_doc" placeholder="11223344" className="flex-1" />
                <Button type="button" variant="outline" onClick={buscar} disabled={searching} title="Buscar beneficiario">
                  <Search size={16} />
                  {searching ? "Buscando…" : "Buscar"}
                </Button>
              </div>
            </Field>

            <Field label="Fecha de nacimiento">
              <Input type="date" name="fecha_nac" />
            </Field>

            <Field label="Nombres">
              <Input name="nombres" placeholder="Nombres" />
            </Field>
            <Field label="Apellidos">
              <Input name="apellidos" placeholder="Apellidos" />
            </Field>
            <Field label="Sexo">
              <Select name="sexo" defaultValue="">
                <option value="">Seleccione</option>
                <option>Femenino</option>
                <option>Masculino</option>
                <option>Otro / Prefiere no decir</option>
              </Select>
            </Field>

            <Field label="Dirección">
              <Input name="direccion" placeholder="Calle 00 # 00-00" />
            </Field>
            <Field label="Barrio / Vereda">
              <Input name="barrio" placeholder="Barrio / Vereda" />
            </Field>
            <Field label="Ciudad / Municipio">
              <Input name="ciudad" placeholder="Ciudad" />
            </Field>

            <Field label="Departamento / Estado">
              <Input name="dpto" placeholder="Departamento" />
            </Field>
            <Field label="Zona">
              <Select name="zona" defaultValue="Urbana">
                <option>Urbana</option>
                <option>Rural</option>
              </Select>
            </Field>
            <Field label="Teléfono de contacto">
              <Input name="telefono" placeholder="300 123 4567" />
            </Field>
          </div>
        </MotionSection>

        {/* ii) Información médica */}
        <MotionSection icon={<Stethoscope size={18} />} title="Información médica" reduceMotion={reduceMotion}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="EPS / Aseguradora">
              <Input name="eps" placeholder="Entidad promotora de salud" />
            </Field>
            <Field label="Grupo sanguíneo y RH">
              <Select name="rh" defaultValue="">
                <option value="">Seleccione</option>
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </Select>
            </Field>
            <Field label="Discapacidad">
              <Select name="discapacidad" defaultValue="">
                <option value="">Ninguna</option>
                <option>Visual</option>
                <option>Auditiva</option>
                <option>Motora</option>
                <option>Cognitiva</option>
                <option>Otra</option>
              </Select>
            </Field>

            <Field label="Alergias">
              <Input name="alergias" placeholder="Ej: penicilina, mariscos…" />
            </Field>
            <Field label="Medicamentos actuales">
              <Input name="medicamentos" placeholder="Lista de fármacos" />
            </Field>
            <Field label="Antecedentes relevantes">
              <Textarea name="antecedentes" rows={3} placeholder="Enfermedades, cirugías, etc." />
            </Field>
          </div>
        </MotionSection>

        {/* iii) Información cultural */}
        <MotionSection icon={<Palette size={18} />} title="Información cultural" reduceMotion={reduceMotion}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Pueblo / Comunidad">
              <Input name="comunidad" placeholder="Ej: Afrodescendiente, Indígena…" />
            </Field>
            <Field label="Lengua / Idioma predominante">
              <Input name="lengua" placeholder="Español, Wayuunaiki, etc." />
            </Field>
            <Field label="Prácticas culturales relevantes">
              <Input name="practicas" placeholder="Ritos, costumbres, etc." />
            </Field>
          </div>
        </MotionSection>

        {/* iv) Contacto de urgencias */}
        <MotionSection icon={<PhoneCall size={18} />} title="Contacto para urgencias" reduceMotion={reduceMotion}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Nombre">
              <Input name="urg_nombre" placeholder="Nombre completo" />
            </Field>
            <Field label="Parentesco">
              <Input name="urg_parentesco" placeholder="Ej: Madre, Hijo, Amigo" />
            </Field>
            <Field label="Teléfono">
              <Input name="urg_tel" placeholder="300 000 0000" />
            </Field>
            <Field label="Dirección">
              <Input name="urg_dir" placeholder="Dirección" />
            </Field>
          </div>
        </MotionSection>

        {/* v) Acudientes (dinámico) */}
        <MotionSection icon={<UserPlus size={18} />} title="Acudientes (si aplica)" reduceMotion={reduceMotion}>
          <div className="grid gap-4">
            <AnimatePresence initial={false}>
              {acudientes.map((a, idx) => (
                <motion.div
                  key={a._key}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-4"
                >
                  <Field label="Nombre">
                    <Input
                      value={a.nombre}
                      onChange={(e) => patchAcudiente(idx, { nombre: e.target.value })}
                      placeholder="Nombre del acudiente"
                    />
                  </Field>
                  <Field label="Parentesco">
                    <Input
                      value={a.parentesco}
                      onChange={(e) => patchAcudiente(idx, { parentesco: e.target.value })}
                      placeholder="Parentesco"
                    />
                  </Field>
                  <Field label="Teléfono">
                    <Input
                      value={a.telefono}
                      onChange={(e) => patchAcudiente(idx, { telefono: e.target.value })}
                      placeholder="300 000 0000"
                    />
                  </Field>
                  <div className="grid gap-1">
                    <span className="text-sm text-slate-700">Dirección</span>
                    <div className="flex items-center gap-2">
                      <Input
                        value={a.direccion}
                        onChange={(e) => patchAcudiente(idx, { direccion: e.target.value })}
                        placeholder="Dirección"
                        className="flex-1"
                      />
                      {acudientes.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => removeAcudiente(idx)}
                          className="inline-flex items-center justify-center rounded-md border border-[var(--subtle)] px-3 py-2 hover:bg-white"
                          title="Eliminar acudiente"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div>
              <Button type="button" variant="outline" onClick={addAcudiente}>
                <Plus size={16} /> Agregar acudiente
              </Button>
            </div>
          </div>
        </MotionSection>

        {/* vi) Carga de documentos PDF */}
        <MotionSection icon={<Upload size={18} />} title="Documentos (PDF)" reduceMotion={reduceMotion}>
          {/* ✅ Nuevos para subir al guardar */}
          <DocumentDropzone
            value={docsNew}
            onChange={setDocsNew}
            disabled={saving || updating}
            maxFiles={10}
            maxSizeMB={10}
          />
          <div className="text-xs text-slate-500">
            Nota: en la opción A los archivos se muestran aquí, pero se suben cuando presionas{" "}
            <b>Guardar</b> o <b>Actualizar</b>.
          </div>

          {/* ✅ Documentos ya guardados (vienen al buscar) */}
          <AnimatePresence initial={false}>
            {docsSaved.length > 0 && (
              <motion.div
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                className="overflow-x-auto rounded-md border border-[var(--subtle)] bg-white"
              >
                <div className="border-b border-[var(--subtle)] px-4 py-3">
                  <div className="text-sm font-semibold text-slate-800">Documentos guardados</div>
                  <div className="text-xs text-slate-500">Estos ya están registrados en el beneficiario.</div>
                </div>

                <table className="min-w-full text-sm">
                  <thead className="border-b border-[var(--subtle)] text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Tamaño</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsSaved.map((d, idx) => {
                      const nombre = (d.nombre ?? d.name ?? "PDF").toString();
                      const tipo = (d.tipo ?? "PDF").toString();
                      const size = Number(d.size ?? 0);
                      return (
                        <tr key={`${nombre}-${size}-${idx}`} className="border-b border-[var(--subtle)]/70 last:border-b-0">
                          <td className="px-3 py-2 font-medium text-slate-800">{nombre}</td>
                          <td className="px-3 py-2 text-slate-700">{tipo}</td>
                          <td className="px-3 py-2 text-slate-700">{size ? formatKB(size) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </MotionSection>

        {/* Pie de acciones */}
        <motion.div layout className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={limpiar}>
            Limpiar
          </Button>
          <Button type="button" variant="outline" onClick={actualizar} disabled={updating}>
            <Pencil size={16} />
            {updating ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button type="button" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </motion.div>
      </motion.form>
    </DashboardShell>
  );
}
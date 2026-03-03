"use client";

import React, { useMemo, useState } from "react";
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
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import DocumentDropzone from "@/components/files/DocumentDropzone";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

/* ---------- UI helpers ---------- */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
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
  const reduceMotion = !!useReducedMotion();
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

/* ---------- Tipos ---------- */
type DocMeta = { nombre?: string; name?: string; size?: number; tipo?: string };

/* ---------- Utils ---------- */
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

function split2(s: string) {
  const parts = String(s || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { a: "", b: "" };
  if (parts.length === 1) return { a: parts[0], b: "" };
  return { a: parts[0], b: parts.slice(1).join(" ") };
}

function formatKB(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function digitsOnly(v: string, max = 20) {
  return String(v || "").replace(/\D/g, "").slice(0, max);
}

function formatPhone(v: string) {
  const d = digitsOnly(v, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/* ---------- Motion Section ---------- */
function MotionSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const reduceMotion = !!useReducedMotion();
  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
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

/* ---------- Schema (RHF + Zod) ---------- */
const TipoDocEnum = z.enum(["CC", "TI", "CE", "RC", "PA", "PEP", "PPT", "NIT", "OTRO"]);

const schema = z.object({
  tipo_doc: TipoDocEnum,
  num_doc: z.string().trim().min(5, "Documento requerido (mínimo 5)"),

  fecha_nac: z.string().optional().or(z.literal("")),
  primer_nombre: z.string().trim().min(2, "Primer nombre requerido"),
  segundo_nombre: z.string().trim().optional().or(z.literal("")),
  primer_apellido: z.string().trim().min(2, "Primer apellido requerido"),
  segundo_apellido: z.string().trim().optional().or(z.literal("")),

  // ✅ correo
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),

  sexo: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  barrio: z.string().optional().or(z.literal("")),
  ciudad: z.string().optional().or(z.literal("")),
  dpto: z.string().optional().or(z.literal("")),
  zona: z.string().optional().or(z.literal("Urbana")),
  telefono: z.string().optional().or(z.literal("")),

  eps: z.string().optional().or(z.literal("")),
  rh: z.string().optional().or(z.literal("")),
  discapacidad: z.string().optional().or(z.literal("")),
  alergias: z.string().optional().or(z.literal("")),
  medicamentos: z.string().optional().or(z.literal("")),
  antecedentes: z.string().optional().or(z.literal("")),

  comunidad: z.string().optional().or(z.literal("")),
  lengua: z.string().optional().or(z.literal("")),
  practicas: z.string().optional().or(z.literal("")),

  urg_nombre: z.string().optional().or(z.literal("")),
  urg_parentesco: z.string().optional().or(z.literal("")),
  urg_tel: z.string().optional().or(z.literal("")),
  urg_dir: z.string().optional().or(z.literal("")),

  acudientes: z
    .array(
      z.object({
        nombre: z.string().trim().optional().or(z.literal("")),
        parentesco: z.string().trim().optional().or(z.literal("")),
        telefono: z.string().trim().optional().or(z.literal("")),
        direccion: z.string().trim().optional().or(z.literal("")),
      })
    )
    .default([{ nombre: "", parentesco: "", telefono: "", direccion: "" }]),
});

type FormValues = z.infer<typeof schema>;

/* ---------- Page ---------- */
export default function BeneficiariosPage() {
  const title = "Beneficiarios";
  const reduceMotion = !!useReducedMotion();

  const [currentId, setCurrentId] = useState<number | null>(null);

  const [docsNew, setDocsNew] = useState<File[]>([]);
  const [docsSaved, setDocsSaved] = useState<DocMeta[]>([]);

  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  const DEFAULTS: FormValues = {
    tipo_doc: "CC",
    num_doc: "",
    fecha_nac: "",
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    email: "",

    sexo: "",
    direccion: "",
    barrio: "",
    ciudad: "",
    dpto: "",
    zona: "Urbana",
    telefono: "",

    eps: "",
    rh: "",
    discapacidad: "",
    alergias: "",
    medicamentos: "",
    antecedentes: "",

    comunidad: "",
    lengua: "",
    practicas: "",

    urg_nombre: "",
    urg_parentesco: "",
    urg_tel: "",
    urg_dir: "",

    acudientes: [{ nombre: "", parentesco: "", telefono: "", direccion: "" }],
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: DEFAULTS,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "acudientes",
  });

  const container = useMemo(
    () => ({
      hidden: { opacity: 1 },
      show: { opacity: 1, transition: reduceMotion ? { duration: 0 } : { staggerChildren: 0.06, delayChildren: 0.02 } },
    }),
    [reduceMotion]
  );

  const lockedDoc = !!currentId;

  const limpiar = () => {
    setCurrentId(null);
    setDocsNew([]);
    setDocsSaved([]);

    // ✅ resetea RHF completo
    form.reset(DEFAULTS);

    // ✅ resetea FieldArray (acudientes) sin loops
    replace(DEFAULTS.acudientes);

    // ✅ opcional: limpia errores/touched
    form.clearErrors();
  };

  const mergeDocsMeta = () => {
    const saved = (docsSaved || []).map((d) => ({
      nombre: String(d.nombre ?? d.name ?? "PDF"),
      tipo: String(d.tipo ?? "PDF"),
      size: Number(d.size ?? 0),
    }));

    const news = (docsNew || []).map((f) => ({
      nombre: f.name,
      tipo: "PDF",
      size: f.size,
    }));

    const seen = new Set<string>();
    return [...saved, ...news].filter((x) => {
      const k = `${x.nombre}__${x.size}`;
      if (!x.nombre) return false;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const buildPayload = (v: FormValues, includeId: boolean) => {
    const primerNombre = v.primer_nombre.trim();
    const segundoNombre = (v.segundo_nombre ?? "").trim();
    const primerApellido = v.primer_apellido.trim();
    const segundoApellido = (v.segundo_apellido ?? "").trim();

    const nombres = [primerNombre, segundoNombre].filter(Boolean).join(" ").trim();
    const apellidos = [primerApellido, segundoApellido].filter(Boolean).join(" ").trim();

    const acudientes = (v.acudientes || []).filter((a) =>
      [a.nombre, a.parentesco, a.telefono, a.direccion].some((x) => String(x || "").trim())
    );

    return {
      ...(includeId && currentId ? { id: currentId } : {}),
      tipo_doc: v.tipo_doc,
      num_doc: digitsOnly(v.num_doc, 20),
      fecha_nac: v.fecha_nac || null,

      // compat + separados
      nombres,
      apellidos,
      primer_nombre: primerNombre,
      segundo_nombre: segundoNombre || null,
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido || null,

      // ✅ email
      email: v.email?.trim() || null,

      sexo: v.sexo || null,
      direccion: v.direccion || null,
      barrio: v.barrio || null,
      ciudad: v.ciudad || null,
      dpto: v.dpto || null,
      zona: v.zona || "Urbana",
      telefono: digitsOnly(v.telefono || "", 15) || null,

      eps: v.eps || null,
      rh: v.rh || null,
      discapacidad: v.discapacidad || null,
      alergias: v.alergias || null,
      medicamentos: v.medicamentos || null,
      antecedentes: v.antecedentes || null,

      comunidad: v.comunidad || null,
      lengua: v.lengua || null,
      practicas: v.practicas || null,

      urg_nombre: v.urg_nombre || null,
      urg_parentesco: v.urg_parentesco || null,
      urg_tel: v.urg_tel || null,
      urg_dir: v.urg_dir || null,

      acudientes,
      docs: mergeDocsMeta(),
    };
  };

  const buscar = async () => {
    const tipo = form.getValues("tipo_doc");
    const doc = digitsOnly(form.getValues("num_doc")?.trim(), 20);

    if (!tipo || !doc) {
      toast.error("Ingrese tipo y número de documento para buscar.");
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `/api/beneficiarios/buscar?tipo=${encodeURIComponent(tipo)}&doc=${encodeURIComponent(doc)}`,
        { cache: "no-store" }
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

      const n = split2(String(data.nombres ?? ""));
      const a = split2(String(data.apellidos ?? ""));

      form.reset({
        tipo_doc: (data.tipo_doc ?? data.tipoDoc ?? tipo) as any,
        num_doc: digitsOnly(String(data.num_doc ?? data.doc ?? doc), 20),
        fecha_nac: toInputDate(data.fecha_nac ?? data.fechaNacimiento),

        primer_nombre: n.a,
        segundo_nombre: n.b,
        primer_apellido: a.a,
        segundo_apellido: a.b,

        email: String(data.email ?? ""),

        sexo: sexoToUi(data.sexo),
        direccion: String(data.direccion ?? ""),
        barrio: String(data.barrio ?? ""),
        ciudad: String(data.ciudad ?? ""),
        dpto: String(data.dpto ?? data.departamento ?? ""),
        zona: zonaToUi(data.zona),
        telefono: formatPhone(String(data.telefono ?? "")),

        eps: String(data.eps ?? ""),
        rh: rhToUi(data.rh),
        discapacidad: discapacidadToUi(data.discapacidad),
        alergias: String(data.alergias ?? ""),
        medicamentos: String(data.medicamentos ?? ""),
        antecedentes: String(data.antecedentes ?? ""),

        comunidad: String(data.comunidad ?? ""),
        lengua: String(data.lengua ?? ""),
        practicas: String(data.practicas ?? data.practicasCulturales ?? ""),

        urg_nombre: String(data.urg_nombre ?? data.urgenciaNombre ?? ""),
        urg_parentesco: String(data.urg_parentesco ?? data.urgenciaParentesco ?? ""),
        urg_tel: String(data.urg_tel ?? data.urgenciaTelefono ?? ""),
        urg_dir: String(data.urg_dir ?? data.urgenciaDireccion ?? ""),

        acudientes: [{ nombre: "", parentesco: "", telefono: "", direccion: "" }],
      });

      const acud = Array.isArray(data.acudientes) ? data.acudientes : [];
      replace(
        acud.length
          ? acud.map((x: any) => ({
              nombre: String(x.nombre ?? ""),
              parentesco: String(x.parentesco ?? ""),
              telefono: formatPhone(String(x.telefono ?? "")),
              direccion: String(x.direccion ?? ""),
            }))
          : [{ nombre: "", parentesco: "", telefono: "", direccion: "" }]
      );

      setDocsSaved(Array.isArray(data.docs) ? data.docs : []);
      setDocsNew([]);

      toast.success("Beneficiario encontrado ✅");
    } catch (e: any) {
      toast.error("Error: " + (e?.message ?? "Desconocido"));
    } finally {
      setSearching(false);
    }
  };

  const guardar = form.handleSubmit(async (values) => {
    if (saving) return;

    try {
      setSaving(true);
      const payload = buildPayload(values, false);

      const res = await fetch("/api/beneficiarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  });

  const actualizar = form.handleSubmit(async (values) => {
    if (updating) return;
    if (!currentId) {
      toast.error("Primero busca un beneficiario para actualizar.");
      return;
    }

    try {
      setUpdating(true);
      const payload = buildPayload(values, true);

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

      toast.success(`Actualizado ✅ ${j.updatedAt ? `(${j.updatedAt})` : ""}`);

      setDocsSaved((prev) => {
        const saved = (prev || []).map((d) => ({
          nombre: d.nombre ?? d.name ?? "PDF",
          tipo: d.tipo ?? "PDF",
          size: Number(d.size ?? 0),
        }));
        const news = (docsNew || []).map((f) => ({ nombre: f.name, tipo: "PDF", size: f.size }));
        const seen = new Set<string>();
        return [...saved, ...news].filter((x) => {
          const k = `${x.nombre}__${x.size}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      });
      setDocsNew([]);
    } catch (e: any) {
      toast.error("Error de red: " + (e?.message ?? "Desconocido"));
    } finally {
      setUpdating(false);
    }
  });

  const e = form.formState.errors;

  return (
    <DashboardShell title={title}>
      <motion.form className="grid gap-6" onSubmit={(ev) => ev.preventDefault()} variants={container} initial="hidden" animate="show" layout>
        {/* Barra acciones */}
        <motion.div
          layout
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="flex items-center justify-between gap-2"
        >
          <div className="text-sm text-slate-600">
            {currentId ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle)] bg-white px-3 py-1">
                Editando ID: <b>{currentId}</b>
              </span>
            ) : (
              <span className="text-slate-500">Nuevo beneficiario</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={limpiar}>
              Limpiar
            </Button>
            <Button type="button" variant="outline" onClick={actualizar} disabled={updating || saving || searching || !currentId}>
              <Pencil size={16} />
              {updating ? "Actualizando…" : "Actualizar"}
            </Button>
            <Button type="button" onClick={guardar} disabled={saving || updating || searching}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </motion.div>

        {/* Identificación */}
        <MotionSection icon={<IdCard size={18} />} title="Datos de identificación y ubicación">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field
              label="Tipo de documento"
              error={e.tipo_doc?.message as any}
              hint={lockedDoc ? "Bloqueado porque ya está vinculado al ID. Usa “Limpiar” para buscar otro." : undefined}
            >
              <Select {...form.register("tipo_doc")} defaultValue="CC" disabled={lockedDoc || saving || updating}>
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="RC">Registro Civil (RC)</option>
                <option value="PA">Pasaporte (PA)</option>
                <option value="PEP">PEP</option>
                <option value="PPT">PPT</option>
                <option value="NIT">NIT</option>
                <option value="OTRO">OTRO</option>
              </Select>
            </Field>

            <Field
              label="Número de documento"
              error={e.num_doc?.message as any}
              hint={lockedDoc ? "Bloqueado porque ya está vinculado al ID. Usa “Limpiar” para buscar otro." : " "}
            >
              <div className="flex gap-2">
                <Input
                  {...form.register("num_doc", {
                    onChange: (ev) => {
                      const next = digitsOnly(ev.target.value, 20);
                      form.setValue("num_doc", next, { shouldValidate: true });
                    },
                  })}
                  placeholder="11223344"
                  className="flex-1"
                  disabled={lockedDoc || saving || updating}
                  inputMode="numeric"
                />
                <Button type="button" variant="outline" onClick={buscar} disabled={searching || saving || updating}>
                  <Search size={16} />
                  {searching ? "Buscando…" : "Buscar"}
                </Button>
              </div>
            </Field>

            <Field label="Fecha de nacimiento">
              <Input type="date" {...form.register("fecha_nac")} disabled={saving || updating} />
            </Field>

            <Field label="Primer nombre" error={e.primer_nombre?.message as any}>
              <Input {...form.register("primer_nombre")} placeholder="Primer nombre" disabled={saving || updating} />
            </Field>
            <Field label="Segundo nombre (opcional)">
              <Input {...form.register("segundo_nombre")} placeholder="Segundo nombre" disabled={saving || updating} />
            </Field>
            <Field label="Primer apellido" error={e.primer_apellido?.message as any}>
              <Input {...form.register("primer_apellido")} placeholder="Primer apellido" disabled={saving || updating} />
            </Field>
            <Field label="Segundo apellido (opcional)">
              <Input {...form.register("segundo_apellido")} placeholder="Segundo apellido" disabled={saving || updating} />
            </Field>

            <Field label="Correo electrónico" error={e.email?.message as any} >
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <Input type="email" {...form.register("email")} placeholder="correo@dominio.com" disabled={saving || updating} className="flex-1" />
              </div>
            </Field>

            <Field label="Sexo">
              <Select {...form.register("sexo")} defaultValue="" disabled={saving || updating}>
                <option value="">Seleccione</option>
                <option>Femenino</option>
                <option>Masculino</option>
                <option>Otro / Prefiere no decir</option>
              </Select>
            </Field>

            <Field label="Dirección">
              <Input {...form.register("direccion")} placeholder="Calle 00 # 00-00" disabled={saving || updating} />
            </Field>
            <Field label="Barrio / Vereda">
              <Input {...form.register("barrio")} placeholder="Barrio / Vereda" disabled={saving || updating} />
            </Field>
            <Field label="Ciudad / Municipio">
              <Input {...form.register("ciudad")} placeholder="Ciudad" disabled={saving || updating} />
            </Field>

            <Field label="Departamento / Estado">
              <Input {...form.register("dpto")} placeholder="Departamento" disabled={saving || updating} />
            </Field>
            <Field label="Zona">
              <Select {...form.register("zona")} defaultValue="Urbana" disabled={saving || updating}>
                <option>Urbana</option>
                <option>Rural</option>
              </Select>
            </Field>
            <Field label="Teléfono de contacto" >
              <Input
                {...form.register("telefono", {
                  onChange: (ev) => {
                    const next = formatPhone(ev.target.value);
                    form.setValue("telefono", next, { shouldValidate: false });
                  },
                })}
                placeholder="300 123 4567"
                disabled={saving || updating}
                inputMode="tel"
              />
            </Field>
          </div>
        </MotionSection>

        {/* Información médica */}
        <MotionSection icon={<Stethoscope size={18} />} title="Información médica">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="EPS / Aseguradora">
              <Input {...form.register("eps")} placeholder="Entidad promotora de salud" disabled={saving || updating} />
            </Field>
            <Field label="Grupo sanguíneo y RH">
              <Select {...form.register("rh")} defaultValue="" disabled={saving || updating}>
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
              <Select {...form.register("discapacidad")} defaultValue="" disabled={saving || updating}>
                <option value="">Ninguna</option>
                <option>Visual</option>
                <option>Auditiva</option>
                <option>Motora</option>
                <option>Cognitiva</option>
                <option>Otra</option>
              </Select>
            </Field>

            <Field label="Alergias">
              <Input {...form.register("alergias")} placeholder="Ej: penicilina, mariscos…" disabled={saving || updating} />
            </Field>
            <Field label="Medicamentos actuales">
              <Input {...form.register("medicamentos")} placeholder="Lista de fármacos" disabled={saving || updating} />
            </Field>
            <Field label="Antecedentes relevantes">
              <Textarea {...form.register("antecedentes")} rows={3} placeholder="Enfermedades, cirugías, etc." disabled={saving || updating} />
            </Field>
          </div>
        </MotionSection>

        {/* Información cultural */}
        <MotionSection icon={<Palette size={18} />} title="Información cultural">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Pueblo / Comunidad">
              <Input {...form.register("comunidad")} placeholder="Ej: Afrodescendiente, Indígena…" disabled={saving || updating} />
            </Field>
            <Field label="Lengua / Idioma predominante">
              <Input {...form.register("lengua")} placeholder="Español, Wayuunaiki, etc." disabled={saving || updating} />
            </Field>
            <Field label="Prácticas culturales relevantes">
              <Input {...form.register("practicas")} placeholder="Ritos, costumbres, etc." disabled={saving || updating} />
            </Field>
          </div>
        </MotionSection>

        {/* Contacto urgencias */}
        <MotionSection icon={<PhoneCall size={18} />} title="Contacto para urgencias">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Nombre">
              <Input {...form.register("urg_nombre")} placeholder="Nombre completo" disabled={saving || updating} />
            </Field>
            <Field label="Parentesco">
              <Input {...form.register("urg_parentesco")} placeholder="Ej: Madre, Hijo, Amigo" disabled={saving || updating} />
            </Field>
            <Field label="Teléfono">
              <Input {...form.register("urg_tel")} placeholder="300 000 0000" disabled={saving || updating} />
            </Field>
            <Field label="Dirección">
              <Input {...form.register("urg_dir")} placeholder="Dirección" disabled={saving || updating} />
            </Field>
          </div>
        </MotionSection>

        {/* Acudientes */}
        <MotionSection icon={<UserPlus size={18} />} title="Acudientes (si aplica)">
          <div className="grid gap-4">
            <AnimatePresence initial={false}>
              {fields.map((f, idx) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-4"
                >
                  <Field label="Nombre">
                    <Input {...form.register(`acudientes.${idx}.nombre` as const)} placeholder="Nombre del acudiente" disabled={saving || updating} />
                  </Field>
                  <Field label="Parentesco">
                    <Input {...form.register(`acudientes.${idx}.parentesco` as const)} placeholder="Parentesco" disabled={saving || updating} />
                  </Field>
                  <Field label="Teléfono">
                    <Input
                      {...form.register(`acudientes.${idx}.telefono` as const, {
                        onChange: (ev) => {
                          const next = formatPhone(ev.target.value);
                          form.setValue(`acudientes.${idx}.telefono` as const, next);
                        },
                      })}
                      placeholder="300 000 0000"
                      disabled={saving || updating}
                    />
                  </Field>

                  <div className="grid gap-1">
                    <span className="text-sm text-slate-700">Dirección</span>
                    <div className="flex items-center gap-2">
                      <Input
                        {...form.register(`acudientes.${idx}.direccion` as const)}
                        placeholder="Dirección"
                        className="flex-1"
                        disabled={saving || updating}
                      />
                      {fields.length > 1 && (
                        <motion.button
                          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          onClick={() => remove(idx)}
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
              <Button type="button" variant="outline" onClick={() => append({ nombre: "", parentesco: "", telefono: "", direccion: "" })} disabled={saving || updating}>
                <Plus size={16} /> Agregar acudiente
              </Button>
            </div>
          </div>
        </MotionSection>

        {/* Documentos */}
        <MotionSection icon={<Upload size={18} />} title="Documentos (PDF)">
          <DocumentDropzone value={docsNew} onChange={setDocsNew} disabled={saving || updating} maxFiles={10} maxSizeMB={10} />
          <div className="text-xs text-slate-500">Se guarda la lista/metadata. (Luego lo conectamos a storage si quieres).</div>

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
                      const nombre = String(d.nombre ?? d.name ?? "PDF");
                      const tipo = String(d.tipo ?? "PDF");
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

        {/* Pie acciones */}
        <motion.div layout className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={limpiar} disabled={saving || updating || searching}>
            Limpiar
          </Button>
          <Button type="button" variant="outline" onClick={actualizar} disabled={updating || saving || searching || !currentId}>
            <Pencil size={16} />
            {updating ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button type="button" onClick={guardar} disabled={saving || updating || searching}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </motion.div>
      </motion.form>
    </DashboardShell>
  );
}
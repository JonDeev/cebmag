"use client";

import React, { useState } from "react";
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
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--subtle)] px-4 py-3">
        <div className="text-[var(--brand)]">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid gap-4 p-4">{children}</div>
    </div>
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
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ---------- Tipos ---------- */
type Acudiente = {
  nombre: string;
  parentesco: string;
  telefono: string;
  direccion: string;
};

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

/* ---------- Página ---------- */
export default function BeneficiariosPage() {
  const title = "Beneficiarios";

  // ✅ id actual (Int) del beneficiario encontrado/seleccionado
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Documentos PDF seleccionados (solo UI)
  const [docs, setDocs] = useState<File[]>([]);
  const onDocsChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type === "application/pdf");
    setDocs((prev) => [...prev, ...arr]);
  };
  const removeDoc = (name: string) =>
    setDocs((prev) => prev.filter((f) => f.name !== name));

  // Lista de acudientes (dinámica)
  const [acudientes, setAcudientes] = useState<Acudiente[]>([
    { nombre: "", parentesco: "", telefono: "", direccion: "" },
  ]);
  const addAcudiente = () =>
    setAcudientes((a) => [
      ...a,
      { nombre: "", parentesco: "", telefono: "", direccion: "" },
    ]);
  const removeAcudiente = (idx: number) =>
    setAcudientes((a) => a.filter((_, i) => i !== idx));
  const patchAcudiente = (idx: number, patch: Partial<Acudiente>) =>
    setAcudientes((a) => a.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  const limpiar = () => {
    setCurrentId(null);
    setDocs([]);
    setAcudientes([{ nombre: "", parentesco: "", telefono: "", direccion: "" }]);

    const form = document.getElementById("benef-form") as HTMLFormElement | null;
    form?.reset();

    // ✅ asegurar que el hidden id quede vacío
    const idEl = form?.querySelector("[name='id']") as HTMLInputElement | null;
    if (idEl) idEl.value = "";
  };

  const buscar = async () => {
    const tipo = (document.querySelector("[name='tipo_doc']") as HTMLSelectElement)
      ?.value;
    const doc = (document.querySelector("[name='num_doc']") as HTMLInputElement)
      ?.value;

    if (!tipo || !doc) {
      toast.error("Ingrese tipo y número de documento para buscar.");
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `/api/beneficiarios/buscar?tipo=${encodeURIComponent(
          tipo
        )}&doc=${encodeURIComponent(doc)}`
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

      // ✅ guardar id (Int) si viene
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
      fill(
        "urg_parentesco",
        data.urg_parentesco ?? data.urgenciaParentesco ?? ""
      );
      fill("urg_tel", data.urg_tel ?? data.urgenciaTelefono ?? "");
      fill("urg_dir", data.urg_dir ?? data.urgenciaDireccion ?? "");

      const acud = data.acudientes ?? data.acudiente ?? null;
      if (Array.isArray(acud)) setAcudientes(acud);

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

    // ✅ parse robusto: evita id=0 cuando está vacío
    const idRaw = fd.get("id");
    const parsed = idRaw === null ? NaN : Number(String(idRaw).trim());
    const id = currentId ?? (Number.isFinite(parsed) ? parsed : null);

    return {
      // ✅ solo si id > 0
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

      acudientes,
      docs: docs.map((f) => ({ nombre: f.name, tipo: "PDF", size: f.size })),
    };
  };

  const guardar = async () => {
    const payload = getPayloadFromForm();
    if (!payload) return;

    // ✅ en CREATE nunca mandes id
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

      toast.success(
        `Actualizado ✅ Última actualización: ${j.updatedAt ?? "ok"}`
      );
    } catch (e: any) {
      toast.error("Error de red: " + (e?.message ?? "Desconocido"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardShell title={title}>
      <form
        id="benef-form"
        className="grid gap-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <input type="hidden" name="id" defaultValue="" />

        {/* Barra de acciones */}
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={limpiar}>
            Limpiar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={actualizar}
            disabled={updating}
          >
            <Pencil size={16} />
            {updating ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button type="button" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>

        {/* i) Identificación y Ubicación */}
        <Section
          icon={<IdCard size={18} />}
          title="Datos de identificación y ubicación"
        >
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={buscar}
                  disabled={searching}
                  title="Buscar beneficiario"
                >
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
        </Section>

        {/* ii) Información médica */}
        <Section icon={<Stethoscope size={18} />} title="Información médica">
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
              <Textarea
                name="antecedentes"
                rows={3}
                placeholder="Enfermedades, cirugías, etc."
              />
            </Field>
          </div>
        </Section>

        {/* iii) Información cultural */}
        <Section icon={<Palette size={18} />} title="Información cultural">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Pueblo / Comunidad">
              <Input
                name="comunidad"
                placeholder="Ej: Afrodescendiente, Indígena…"
              />
            </Field>
            <Field label="Lengua / Idioma predominante">
              <Input name="lengua" placeholder="Español, Wayuunaiki, etc." />
            </Field>
            <Field label="Prácticas culturales relevantes">
              <Input name="practicas" placeholder="Ritos, costumbres, etc." />
            </Field>
          </div>
        </Section>

        {/* iv) Contacto de urgencias */}
        <Section icon={<PhoneCall size={18} />} title="Contacto para urgencias">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Nombre">
              <Input name="urg_nombre" placeholder="Nombre completo" />
            </Field>
            <Field label="Parentesco">
              <Input
                name="urg_parentesco"
                placeholder="Ej: Madre, Hijo, Amigo"
              />
            </Field>
            <Field label="Teléfono">
              <Input name="urg_tel" placeholder="300 000 0000" />
            </Field>
            <Field label="Dirección">
              <Input name="urg_dir" placeholder="Dirección" />
            </Field>
          </div>
        </Section>

        {/* v) Acudientes (dinámico) */}
        <Section icon={<UserPlus size={18} />} title="Acudientes (si aplica)">
          <div className="grid gap-4">
            {acudientes.map((a, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Nombre">
                  <Input
                    value={a.nombre}
                    onChange={(e) =>
                      patchAcudiente(idx, { nombre: e.target.value })
                    }
                    placeholder="Nombre del acudiente"
                  />
                </Field>
                <Field label="Parentesco">
                  <Input
                    value={a.parentesco}
                    onChange={(e) =>
                      patchAcudiente(idx, { parentesco: e.target.value })
                    }
                    placeholder="Parentesco"
                  />
                </Field>
                <Field label="Teléfono">
                  <Input
                    value={a.telefono}
                    onChange={(e) =>
                      patchAcudiente(idx, { telefono: e.target.value })
                    }
                    placeholder="300 000 0000"
                  />
                </Field>
                <div className="grid gap-1">
                  <span className="text-sm text-slate-700">Dirección</span>
                  <div className="flex items-center gap-2">
                    <Input
                      value={a.direccion}
                      onChange={(e) =>
                        patchAcudiente(idx, { direccion: e.target.value })
                      }
                      placeholder="Dirección"
                      className="flex-1"
                    />
                    {acudientes.length > 1 && (
                      <button
                        onClick={() => removeAcudiente(idx)}
                        className="inline-flex items-center justify-center rounded-md border border-[var(--subtle)] px-3 py-2 hover:bg-white"
                        title="Eliminar acudiente"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div>
              <Button type="button" variant="outline" onClick={addAcudiente}>
                <Plus size={16} /> Agregar acudiente
              </Button>
            </div>
          </div>
        </Section>

        {/* vi) Carga de documentos PDF */}
        <Section icon={<Upload size={18} />} title="Documentos (PDF)">
          <div className="grid gap-4">
            <div className="rounded-md border border-dashed border-[var(--subtle)] bg-[var(--panel)] p-6 text-center">
              <p className="mb-3 text-sm text-slate-600">
                Arrastra aquí archivos PDF o selecciona desde tu equipo.
              </p>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => onDocsChange(e.target.files)}
                className="block mx-auto"
              />
              <p className="mt-2 text-xs text-slate-500">
                Ejemplos: documento de identidad, consentimientos, etc.
              </p>
            </div>

            {docs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-[var(--subtle)] text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Archivo</th>
                      <th className="px-3 py-2 text-left">Tamaño</th>
                      <th className="w-32 px-3 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((f) => (
                      <tr
                        key={f.name}
                        className="border-b border-[var(--subtle)]/70"
                      >
                        <td className="px-3 py-2">{f.name}</td>
                        <td className="px-3 py-2">
                          {(f.size / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeDoc(f.name)}
                            className="inline-flex items-center gap-2 rounded-md border border-[var(--subtle)] px-3 py-1.5 hover:bg-white"
                            type="button"
                          >
                            <Trash2 size={14} /> Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Section>

        {/* Pie de acciones */}
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={limpiar}>
            Limpiar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={actualizar}
            disabled={updating}
          >
            <Pencil size={16} />
            {updating ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button type="button" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}
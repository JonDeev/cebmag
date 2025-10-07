"use client";

import { useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import {
  IdCard, MapPin, Stethoscope, Palette, PhoneCall, UserPlus, Upload, Trash2, Plus,
} from "lucide-react";

/* ---------- UI helpers (inputs básicos) ---------- */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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
      className={`rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--subtle)] px-4 py-3">
        <div className="text-[var(--brand)]">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4 grid gap-4">{children}</div>
    </div>
  );
}
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

/* ---------- Tipos mínimos ---------- */
type Acudiente = { nombre: string; parentesco: string; telefono: string; direccion: string };

/* ---------- Página ---------- */
export default function BeneficiariosPage() {
  const title = "Beneficiarios";

  // Documentos PDF seleccionados (solo UI)
  const [docs, setDocs] = useState<File[]>([]);
  const onDocsChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type === "application/pdf");
    setDocs((prev) => [...prev, ...arr]);
  };
  const removeDoc = (name: string) => setDocs((prev) => prev.filter((f) => f.name !== name));

  // Lista de acudientes (dinámica)
  const [acudientes, setAcudientes] = useState<Acudiente[]>([
    { nombre: "", parentesco: "", telefono: "", direccion: "" },
  ]);
  const addAcudiente = () =>
    setAcudientes((a) => [...a, { nombre: "", parentesco: "", telefono: "", direccion: "" }]);
  const removeAcudiente = (idx: number) => setAcudientes((a) => a.filter((_, i) => i !== idx));
  const patchAcudiente = (idx: number, patch: Partial<Acudiente>) =>
    setAcudientes((a) => a.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  // Acciones de pantalla (sin backend)
  const guardar = () => alert("Formulario guardado (UI sin backend).");
  const limpiar = () => {
    setDocs([]);
    setAcudientes([{ nombre: "", parentesco: "", telefono: "", direccion: "" }]);
    (document.getElementById("benef-form") as HTMLFormElement | null)?.reset();
  };

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6">
        {/* Barra de acciones */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={limpiar}>Limpiar</Button>
          <Button onClick={guardar}>Guardar</Button>
        </div>

        {/* i) Identificación y Ubicación */}
        <Section icon={<IdCard size={18} />} title="Datos de identificación y ubicación">
          <form id="benef-form" className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Input name="num_doc" placeholder="11223344" />
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
          </form>
        </Section>

        {/* ii) Información médica */}
        <Section icon={<Stethoscope size={18} />} title="Información médica">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="EPS / Aseguradora">
              <Input name="eps" placeholder="Entidad promotora de salud" />
            </Field>
            <Field label="Grupo sanguíneo y RH">
              <Select name="rh" defaultValue="">
                <option value="">Seleccione</option>
                <option>O+</option><option>O-</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
              </Select>
            </Field>
            <Field label="Discapacidad">
              <Select name="discapacidad" defaultValue="">
                <option value="">Ninguna</option>
                <option>Visual</option><option>Auditiva</option><option>Motora</option>
                <option>Cognitiva</option><option>Otra</option>
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
        </Section>

        {/* iii) Información cultural */}
        <Section icon={<Palette size={18} />} title="Información cultural">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </Section>

        {/* iv) Contacto de urgencias */}
        <Section icon={<PhoneCall size={18} />} title="Contacto para urgencias">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </Section>

        {/* v) Acudientes (dinámico) */}
        <Section icon={<UserPlus size={18} />} title="Acudientes (si aplica)">
          <div className="grid gap-4">
            {acudientes.map((a, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Button variant="outline" onClick={addAcudiente}>
                <Plus size={16} /> Agregar acudiente
              </Button>
            </div>
          </div>
        </Section>

        {/* vi) Carga de documentos PDF */}
        <Section icon={<Upload size={18} />} title="Documentos (PDF)">
          <div className="grid gap-4">
            <div
              className="rounded-md border border-dashed border-[var(--subtle)] bg-[var(--panel)] p-6 text-center"
            >
              <p className="text-sm text-slate-600 mb-3">
                Arrastra aquí archivos PDF o selecciona desde tu equipo.
              </p>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => onDocsChange(e.target.files)}
                className="mx-auto block"
              />
              <p className="text-xs text-slate-500 mt-2">Ejemplos: documento de identidad, consentimientos, etc.</p>
            </div>

            {docs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-[var(--subtle)] text-slate-500">
                    <tr>
                      <th className="text-left py-2 px-3">Archivo</th>
                      <th className="text-left py-2 px-3">Tamaño</th>
                      <th className="text-left py-2 px-3 w-32">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((f) => (
                      <tr key={f.name} className="border-b border-[var(--subtle)]/70">
                        <td className="py-2 px-3">{f.name}</td>
                        <td className="py-2 px-3">{(f.size / 1024).toFixed(1)} KB</td>
                        <td className="py-2 px-3">
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
          <Button variant="ghost" onClick={limpiar}>Limpiar</Button>
          <Button onClick={guardar}>Guardar</Button>
        </div>
      </div>
    </DashboardShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import { Plus, ShieldCheck, X, Pencil, Trash2 } from "lucide-react";

// ——— Tipos y mock ———
type Rol = "Administrador" | "Asistencial" | "Operativo" | "Consulta";
type Estado = "Activo" | "Inactivo";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  estado: Estado;
};

const MOCK_USERS: Usuario[] = [
  { id: 1, nombre: "Ana Torres", email: "ana.torres@cebmag.co", rol: "Administrador", estado: "Activo" },
  { id: 2, nombre: "Carlos Pérez", email: "carlos.perez@cebmag.co", rol: "Asistencial", estado: "Activo" },
  { id: 3, nombre: "Luisa Ríos", email: "luisa.rios@cebmag.co", rol: "Operativo", estado: "Inactivo" },
];

// ——— Componentes UI mínimos ———
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

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "emerald" | "rose" | "slate" }) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  } as const;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${map[color]}`}>{children}</span>;
}

// ——— Modal simple ———
function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
          <h4 className="text-sm font-semibold">{title}</h4>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3">
          {actions}
        </div>
      </div>
    </div>
  );
}

// ——— Página principal ———
export default function UsuariosPage() {
  const title = "Usuarios y permisos";
  const [rows, setRows] = useState<Usuario[]>(MOCK_USERS);
  const [q, setQ] = useState(""); // búsqueda
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((u) => [u.nombre, u.email, u.rol, u.estado].some((v) => v.toLowerCase().includes(t)));
  }, [q, rows]);

  const startCreate = () => {
    setEditing({ id: 0, nombre: "", email: "", rol: "Consulta", estado: "Activo" });
    setOpen(true);
  };
  const startEdit = (u: Usuario) => {
    setEditing({ ...u });
    setOpen(true);
  };
  const save = () => {
    if (!editing) return;
    if (editing.id === 0) {
      const newId = Math.max(0, ...rows.map((r) => r.id)) + 1;
      setRows((r) => [...r, { ...editing, id: newId }]);
    } else {
      setRows((r) => r.map((x) => (x.id === editing.id ? editing : x)));
    }
    setOpen(false);
  };
  const remove = (id: number) => setRows((r) => r.filter((x) => x.id !== id));

  return (
    <DashboardShell title={title}>
      <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Buscar por nombre, email o rol..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={startCreate}>
              <Plus size={16} /> Nuevo usuario
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--subtle)] text-slate-500">
              <tr>
                <th className="text-left py-2 pl-4 pr-3">Usuario</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Rol</th>
                <th className="text-left py-2 px-3">Estado</th>
                <th className="text-left py-2 px-3 w-40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[var(--subtle)]/70">
                  <td className="py-2 pl-4 pr-3">{u.nombre}</td>
                  <td className="py-2 px-3">{u.email}</td>
                  <td className="py-2 px-3">
                    <Badge color="slate">{u.rol}</Badge>
                  </td>
                  <td className="py-2 px-3">
                    <Badge color={u.estado === "Activo" ? "emerald" : "rose"}>{u.estado}</Badge>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => startEdit(u)}>
                        <Pencil size={14} /> Editar
                      </Button>
                      <Button variant="ghost" onClick={() => remove(u.id)}>
                        <Trash2 size={14} /> Quitar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing?.id ? "Editar usuario" : "Nuevo usuario"}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Nombre</span>
            <Input
              value={editing?.nombre || ""}
              onChange={(e) => setEditing((p) => (p ? { ...p, nombre: e.target.value } : p))}
              placeholder="Nombre completo"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Email</span>
            <Input
              value={editing?.email || ""}
              onChange={(e) => setEditing((p) => (p ? { ...p, email: e.target.value } : p))}
              placeholder="correo@cebmag.co"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Rol</span>
            <Select
              value={editing?.rol || "Consulta"}
              onChange={(e) => setEditing((p) => (p ? { ...p, rol: e.target.value as Rol } : p))}
            >
              {(["Administrador", "Asistencial", "Operativo", "Consulta"] as Rol[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Estado</span>
            <Select
              value={editing?.estado || "Activo"}
              onChange={(e) => setEditing((p) => (p ? { ...p, estado: e.target.value as Estado } : p))}
            >
              {(["Activo", "Inactivo"] as Estado[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Modal>
    </DashboardShell>
  );
}

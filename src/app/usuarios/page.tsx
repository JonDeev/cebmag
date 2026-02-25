"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../_components/DashboardShell";
import { Plus, ShieldCheck, X, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import ConfirmModal from "@/components/ui/ConfirmModal";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type Usuario,
} from "@/lib/usuarios.api";

/* ================= UI helpers ================= */
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

function Badge({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "emerald" | "rose" | "slate";
}) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${map[color]}`}>
      {children}
    </span>
  );
}

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
      <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl">
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

/* ================= Roles from /api/roles ================= */
type Role = { id: number; name: string; description?: string | null };

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`/api/roles?ts=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw || null;
  }

  if (!res.ok) {
    const msg =
      (typeof data === "object" ? data?.error || data?.message : data) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items as Role[];
}

/* ================= Draft ================= */
type Draft = {
  id?: number;
  nombre: string;
  email: string;
  activo: boolean;
  roleId?: number | null; // UI (1 rol)
  password?: string; // solo crear
};

function userRolesLabel(u: Usuario) {
  const names = (u.roles ?? []).map((r) => r.name).filter(Boolean);
  return names.length ? names.join(", ") : "—";
}
function userPrimaryRoleId(u: Usuario) {
  const first = u.roles?.[0]?.id;
  return typeof first === "number" ? first : null;
}

function genTempPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/* ================= Page ================= */
export default function UsuariosPage() {
  const title = "Usuarios y permisos";
  const router = useRouter();

  // 🔧 CAMBIA AQUÍ si tu ruta es /dashboard/roles
  const ROLES_PATH = "/roles";

  const [rows, setRows] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Usuario | null>(null);

  const loadUsers = async (qText?: string) => {
    setLoading(true);
    try {
      const items = await getUsers({ q: qText ?? q });
      setRows(items || []);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const items = await fetchRoles();
      setRoles(items);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudieron cargar roles");
      setRoles([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;

    return rows.filter((u) => {
      const nombre = (u.nombre ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const rolesTxt = userRolesLabel(u).toLowerCase();
      const estado = u.activo ? "activo" : "inactivo";
      return [nombre, email, rolesTxt, estado].some((v) => v.includes(t));
    });
  }, [q, rows]);

  const startCreate = () => {
    const defaultRoleId = roles[0]?.id ?? null;
    setEditing({
      nombre: "",
      email: "",
      activo: true,
      roleId: defaultRoleId,
      password: "",
    });
    setOpen(true);
  };

  const startEdit = (u: Usuario) => {
    setEditing({
      id: u.id,
      nombre: u.nombre ?? "",
      email: u.email,
      activo: !!u.activo,
      roleId: userPrimaryRoleId(u),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;

    const nombre = (editing.nombre ?? "").trim();
    const email = (editing.email ?? "").trim();
    if (!email) return toast.error("Email requerido");

    const roleId = typeof editing.roleId === "number" ? editing.roleId : null;
    const roleIds = roleId ? [roleId] : [];

    // CREATE
    if (!editing.id) {
      let password = (editing.password ?? "").trim();
      if (!password) {
        password = genTempPassword(10);
        toast(`Contraseña temporal: ${password}`, { duration: 9000 });
      }

      const created = await createUser({
        email,
        password,
        nombre: nombre || undefined,
        activo: !!editing.activo,
        roleIds,
      });

      if (!created) return;

      setOpen(false);
      await loadUsers(q);
      return;
    }

    // UPDATE
    const updated = await updateUser(editing.id, {
      nombre: nombre || "",
      activo: !!editing.activo,
      roleIds,
    });

    if (!updated) return;

    setOpen(false);
    await loadUsers(q);
  };

  const askRemove = (u: Usuario) => {
    setToDelete(u);
    setConfirmOpen(true);
  };

  const doRemove = async () => {
    if (!toDelete) return;

    setConfirmLoading(true);
    try {
      const ok = await deleteUser(toDelete.id);
      if (!ok) return;

      setConfirmOpen(false);
      setToDelete(null);
      await loadUsers(q);
    } finally {
      setConfirmLoading(false);
    }
  };

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
            <Input
              placeholder="Buscar por nombre, email o rol..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[min(360px,70vw)]"
            />

            {/* ✅ BOTÓN NUEVO: ir a Roles y permisos */}
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(ROLES_PATH)}
              title="Gestionar roles y permisos"
            >
              <ShieldCheck size={16} /> Roles y permisos
            </Button>

            <Button type="button" onClick={startCreate}>
              <Plus size={16} /> Nuevo usuario
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--subtle)] text-slate-500">
              <tr>
                <th className="py-2 pl-4 pr-3 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="w-40 px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Cargando…
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--subtle)]/70">
                    <td className="py-2 pl-4 pr-3">{u.nombre || "—"}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">
                      <Badge color="slate">{userRolesLabel(u)}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge color={u.activo ? "emerald" : "rose"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" type="button" onClick={() => startEdit(u)}>
                          <Pencil size={14} /> Editar
                        </Button>
                        <Button variant="ghost" type="button" onClick={() => askRemove(u)}>
                          <Trash2 size={14} /> Quitar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
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
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              disabled={!!editing?.id}
            />
            {!!editing?.id && (
              <div className="text-xs text-slate-500">
                * El email no se modifica desde esta pantalla.
              </div>
            )}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Rol</span>
            <Select
              value={String(editing?.roleId ?? "")}
              onChange={(e) =>
                setEditing((p) =>
                  p ? { ...p, roleId: e.target.value ? Number(e.target.value) : null } : p
                )
              }
            >
              <option value="">— Seleccionar —</option>
              {roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </Select>
            {roles.length === 0 && (
              <div className="mt-1 text-xs text-rose-600">
                No hay roles cargados. Revisa <b>/api/roles</b>.
              </div>
            )}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Estado</span>
            <Select
              value={editing?.activo ? "Activo" : "Inactivo"}
              onChange={(e) => setEditing((p) => (p ? { ...p, activo: e.target.value === "Activo" } : p))}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </label>

          {/* Password solo crear */}
          {!editing?.id && (
            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="text-slate-600">Contraseña (opcional)</span>
              <Input
                type="password"
                value={editing?.password || ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, password: e.target.value } : p))}
                placeholder="Si lo dejas vacío, se generará una temporal"
              />
            </label>
          )}
        </div>
      </Modal>

      {/* Confirm eliminar */}
      <ConfirmModal
        open={confirmOpen}
        loading={confirmLoading}
        title="Eliminar usuario"
        message={
          toDelete
            ? `¿Eliminar el usuario ${toDelete.nombre ?? "—"} (${toDelete.email})?`
            : "¿Eliminar usuario?"
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        tone="danger"
        onClose={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
            setToDelete(null);
          }
        }}
        onConfirm={doRemove}
      />
    </DashboardShell>
  );
}
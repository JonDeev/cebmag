"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../_components/DashboardShell";
import { Plus, ShieldCheck, X, Pencil, Trash2, RefreshCw, Mail, UserCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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

/* ================= Modal (animado) ================= */
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
              className="w-[min(760px,94vw)] max-h-[92vh] overflow-hidden rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3 shrink-0">
                <h4 className="text-sm font-semibold">{title}</h4>
                <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" type="button" aria-label="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 min-h-0 p-4 overflow-y-auto">{children}</div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3 shrink-0">
                {actions}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
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
    const msg = (typeof data === "object" ? data?.error || data?.message : data) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items as Role[];
}

/* ================= Draft ================= */
type Draft = {
  id?: number;
  usuario: string;
  nombre: string;
  email: string;
  activo: boolean;
  roleId?: number | null;
  password?: string;
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

function isValidEmail(email: string) {
  const e = String(email || "").trim();
  if (!e) return false;
  // simple y suficiente para UI
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ================= Page ================= */
export default function UsuariosPage() {
  const title = "Usuarios y permisos";
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // 🔧 CAMBIA AQUÍ si tu ruta es distinta
  const ROLES_PATH = "/roles";

  const [rows, setRows] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Usuario | null>(null);

  const loadUsers = async (qText?: string) => {
    setLoading(true);
    try {
      const items = await getUsers({ q: qText ?? q });
      setRows(items || []);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudieron cargar usuarios");
      setRows([]);
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

  const reloadAll = async () => {
    const t = toast.loading("Recargando...");
    try {
      await Promise.all([loadUsers(q), loadRoles()]);
      toast.success("Listo ✅", { id: t });
    } catch {
      toast.dismiss(t);
    }
  };

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => loadUsers(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;

    return rows.filter((u) => {
      const usuario = String((u as any).usuario ?? "").toLowerCase();
      const nombre = (u.nombre ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const rolesTxt = userRolesLabel(u).toLowerCase();
      const estado = u.activo ? "activo" : "inactivo";
      return [usuario, nombre, email, rolesTxt, estado].some((v) => v.includes(t));
    });
  }, [q, rows]);

  const startCreate = () => {
    const defaultRoleId = roles[0]?.id ?? null;
    setEditing({
      usuario: "",
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
      usuario: (u as any).usuario ?? "",
      nombre: u.nombre ?? "",
      email: u.email ?? "",
      activo: !!u.activo,
      roleId: userPrimaryRoleId(u),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing || saving) return;

    const usuario = (editing.usuario ?? "").trim();
    const nombre = (editing.nombre ?? "").trim();
    const email = (editing.email ?? "").trim();

    if (!usuario) return toast.error("Usuario requerido");
    if (usuario.length < 3) return toast.error("Usuario mínimo 3 caracteres");
    if (!email) return toast.error("Email requerido");
    if (!isValidEmail(email)) return toast.error("Email inválido");

    const roleId = typeof editing.roleId === "number" ? editing.roleId : null;
    const roleIds = roleId ? [roleId] : [];

    setSaving(true);
    const t = toast.loading(editing.id ? "Actualizando..." : "Creando...");
    try {
      if (!editing.id) {
        let password = (editing.password ?? "").trim();
        if (!password) {
          password = genTempPassword(10);
          toast(`Contraseña temporal: ${password}`, { duration: 9000 });
        }

        const created = await createUser({
          usuario,
          email,
          password,
          nombre: nombre || undefined,
          activo: !!editing.activo,
          roleIds,
        });

        if (!created) {
          toast.dismiss(t);
          return;
        }

        toast.success("Usuario creado ✅", { id: t });
        setOpen(false);
        await loadUsers(q);
        return;
      }

      // ✅ AQUÍ VA EL CAMBIO: ahora también actualiza el email
      const updated = await updateUser(editing.id, {
        usuario,
        nombre: nombre || "",
        email, // ✅ editable
        activo: !!editing.activo,
        roleIds,
      } as any);

      if (!updated) {
        toast.dismiss(t);
        return;
      }

      toast.success("Usuario actualizado ✅", { id: t });
      setOpen(false);
      await loadUsers(q);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar", { id: t });
    } finally {
      setSaving(false);
    }
  };

  const askRemove = (u: Usuario) => {
    setToDelete(u);
    setConfirmOpen(true);
  };

  const doRemove = async () => {
    if (!toDelete) return;

    setConfirmLoading(true);
    const t = toast.loading("Eliminando...");
    try {
      const ok = await deleteUser(toDelete.id);
      if (!ok) {
        toast.dismiss(t);
        return;
      }
      toast.success("Eliminado ✅", { id: t });
      setConfirmOpen(false);
      setToDelete(null);
      await loadUsers(q);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar", { id: t });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <DashboardShell title={title}>
      <motion.div
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
        className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]"
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por usuario, nombre, email o rol..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[min(380px,70vw)]"
            />

            <Button variant="outline" type="button" onClick={reloadAll}>
              <RefreshCw size={16} /> Recargar
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(ROLES_PATH)}
              title="Gestionar roles y permisos"
            >
              <ShieldCheck size={16} /> Roles
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
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="w-40 px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Cargando…
                  </td>
                </tr>
              )}

              <AnimatePresence initial={false}>
                {!loading &&
                  filtered.map((u) => {
                    const username = String((u as any).usuario ?? "").trim() || "—";
                    return (
                      <motion.tr
                        key={u.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.12 }}
                        className="border-b border-[var(--subtle)]/70"
                      >
                        <td className="py-2 pl-4 pr-3 font-medium">{username}</td>
                        <td className="px-3 py-2">{u.nombre || "—"}</td>
                        <td className="px-3 py-2">{u.email || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge color="slate">{userRolesLabel(u)}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge color={u.activo ? "emerald" : "rose"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
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
                      </motion.tr>
                    );
                  })}
              </AnimatePresence>

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Crear/Editar */}
      <Modal
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        title={editing?.id ? "Editar usuario" : "Nuevo usuario"}
        actions={
          <>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <UserCircle2 size={14} /> Nombre
            </span>
            <Input
              value={editing?.nombre || ""}
              onChange={(e) => setEditing((p) => (p ? { ...p, nombre: e.target.value } : p))}
              placeholder="Nombre completo"
              disabled={saving}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Usuario</span>
            <Input
              value={editing?.usuario || ""}
              onChange={(e) => setEditing((p) => (p ? { ...p, usuario: e.target.value } : p))}
              placeholder="Ej: admin, operador1"
              disabled={saving}
            />
            <div className="text-xs text-slate-500">* Usuario para iniciar sesión.</div>
          </label>

          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="flex items-center gap-2 text-slate-600">
              <Mail size={14} /> Email
            </span>
            <Input
              value={editing?.email || ""}
              onChange={(e) => setEditing((p) => (p ? { ...p, email: e.target.value } : p))}
              placeholder="correo@cebmag.co"
              disabled={saving}
            />
            <div className="text-xs text-slate-500">
              ✅ Ahora el email también se actualiza al editar.
            </div>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Rol</span>
            <Select
              value={String(editing?.roleId ?? "")}
              onChange={(e) =>
                setEditing((p) => (p ? { ...p, roleId: e.target.value ? Number(e.target.value) : null } : p))
              }
              disabled={saving}
            >
              <option value="">— Seleccionar —</option>
              {roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </Select>
            {roles.length === 0 && (
              <div className="mt-1 text-xs text-rose-600">No hay roles cargados. Revisa /api/roles.</div>
            )}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Estado</span>
            <Select
              value={editing?.activo ? "Activo" : "Inactivo"}
              onChange={(e) => setEditing((p) => (p ? { ...p, activo: e.target.value === "Activo" } : p))}
              disabled={saving}
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
                disabled={saving}
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
        message={toDelete ? `¿Eliminar el usuario ${toDelete.nombre ?? "—"} (${toDelete.email})?` : "¿Eliminar usuario?"}
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
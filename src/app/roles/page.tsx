"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardShell from "../_components/DashboardShell";

import ConfirmModal from "@/components/ui/ConfirmModal";

import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  KeyRound,
} from "lucide-react";

/* ================= UI helpers ================= */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition whitespace-nowrap";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] bg-white hover:bg-slate-50"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "hover:bg-slate-50";
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
      className={`w-full rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
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
    <div className="rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-sm">
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
  title,
  onClose,
  actions,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--subtle)] bg-[var(--panel)] shadow-xl ${
          wide ? "w-[min(980px,96vw)]" : "w-[min(680px,92vw)]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--brand)]" />
            <h4 className="text-sm font-semibold">{title}</h4>
          </div>
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--subtle)] bg-white px-2 py-0.5 text-[11px] text-slate-700">
      {children}
    </span>
  );
}

/* ================= Types ================= */
type RoleRow = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: any | null;
  usersCount?: number; // si tu API lo envía
};

type RoleDraft = {
  id?: number;
  name: string;
  description: string;
  permissionsText: string; // JSON en texto
};

/* ================= API helpers ================= */
const API_BASE = "/api/roles";
const BACK_PATH = "/usuarios"; // 👈 cambia si tu ruta es otra

async function readJsonOrText(res: Response) {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw || null;
  }
}
function errMsg(data: any, fallback: string) {
  return (typeof data === "object" ? data?.error || data?.message : data) || fallback;
}

async function apiListRoles(q?: string): Promise<RoleRow[]> {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  sp.set("ts", String(Date.now()));

  const res = await fetch(`${API_BASE}?${sp.toString()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });
  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
  const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
  return items as RoleRow[];
}

async function apiCreateRole(payload: { name: string; description?: string | null; permissions?: any | null }) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
    body: JSON.stringify(payload),
  });
  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
  return body as RoleRow;
}

async function apiUpdateRole(id: number, payload: { name?: string; description?: string | null; permissions?: any | null }) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
    body: JSON.stringify(payload),
  });
  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
  return body as RoleRow;
}

async function apiDeleteRole(id: number) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { "cache-control": "no-cache" },
  });
  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
  return true;
}

/* ================= Page ================= */
export default function RolesPermisosPage() {
  const router = useRouter();
  const title = "Roles y permisos";

  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");

  // modal create/edit
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RoleDraft | null>(null);

  // confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState<RoleRow | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => `${r.name} ${r.description ?? ""}`.toLowerCase().includes(t));
  }, [q, rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const totalUsers = rows.reduce((a, b) => a + Number(b.usersCount ?? 0), 0);
    const perms = rows.reduce((a, b) => {
      const p = b.permissions;
      if (!p) return a;
      if (Array.isArray(p)) return a + p.length;
      if (typeof p === "object") return a + Object.keys(p).length;
      return a + 1;
    }, 0);
    return { total, totalUsers, perms };
  }, [rows]);

  const reload = async () => {
    setLoading(true);
    try {
      const items = await apiListRoles(q);
      setRows(items);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudieron cargar roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => reload(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const startCreate = () => {
    setDraft({
      name: "",
      description: "",
      permissionsText: "{\n  \n}",
    });
    setOpen(true);
  };

  const startEdit = (r: RoleRow) => {
    setDraft({
      id: r.id,
      name: r.name ?? "",
      description: r.description ?? "",
      permissionsText: r.permissions == null ? "{\n  \n}" : JSON.stringify(r.permissions, null, 2),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft) return;

    const name = draft.name.trim();
    if (!name) return toast.error("Nombre del rol requerido");

    let permissions: any = null;
    const txt = (draft.permissionsText ?? "").trim();
    if (txt) {
      try {
        permissions = JSON.parse(txt);
      } catch {
        return toast.error("Permisos: JSON inválido");
      }
    }

    const payload = {
      name,
      description: draft.description.trim() ? draft.description.trim() : null,
      permissions,
    };

    const t = toast.loading(draft.id ? "Guardando rol..." : "Creando rol...");
    try {
      if (draft.id) {
        await apiUpdateRole(draft.id, payload);
        toast.success("Rol actualizado ✅", { id: t });
      } else {
        await apiCreateRole(payload);
        toast.success("Rol creado ✅", { id: t });
      }
      setOpen(false);
      setDraft(null);
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Error guardando rol", { id: t });
    }
  };

  const askDelete = (r: RoleRow) => {
    setToDelete(r);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setConfirmLoading(true);

    const t = toast.loading("Eliminando rol...");
    try {
      await apiDeleteRole(toDelete.id);
      toast.success("Rol eliminado ✅", { id: t });
      setConfirmOpen(false);
      setToDelete(null);
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar", { id: t });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6">
        {/* Header compacto */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={() => router.push(BACK_PATH)}>
              <ArrowLeft size={16} /> Regresar
            </Button>
            <div className="ml-1">
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-slate-500">Gestiona roles y permisos del sistema</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[min(380px,70vw)]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input className="pl-8" placeholder="Buscar rol..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button type="button" onClick={startCreate}>
              <Plus size={16} /> Nuevo rol
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--subtle)] bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} /> Roles
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
          </div>

          <div className="rounded-xl border border-[var(--subtle)] bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users size={14} /> Asignaciones (usuarios)
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.totalUsers}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              * Si tu GET /api/roles no envía usersCount, aquí saldrá 0.
            </div>
          </div>

          <div className="rounded-xl border border-[var(--subtle)] bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <KeyRound size={14} /> Bloques de permisos
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.perms}</div>
          </div>
        </div>

        {/* Tabla */}
        <Section
          title="Listado de roles"
          icon={<ShieldCheck size={18} />}
          actions={<div className="text-xs text-slate-500">{loading ? "Cargando..." : `${filtered.length} rol(es)`}</div>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                  <th className="py-2 pl-2 pr-3 text-left">Rol</th>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-left">Usuarios</th>
                  <th className="px-3 py-2 text-left">Permisos</th>
                  <th className="px-3 py-2 text-left w-[220px]">Acciones</th>
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
                  filtered.map((r) => {
                    const usersCount = Number(r.usersCount ?? 0);
                    const permsCount =
                      r.permissions == null
                        ? 0
                        : Array.isArray(r.permissions)
                        ? r.permissions.length
                        : typeof r.permissions === "object"
                        ? Object.keys(r.permissions).length
                        : 1;

                    return (
                      <tr key={r.id} className="border-b border-[var(--subtle)]/70">
                        <td className="py-2 pl-2 pr-3 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {r.description?.trim() ? r.description : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <Pill>{usersCount}</Pill>
                        </td>
                        <td className="px-3 py-2">
                          <Pill>{permsCount}</Pill>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" type="button" onClick={() => startEdit(r)}>
                              <Pencil size={14} /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => askDelete(r)}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 size={14} /> Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No hay roles para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Modal crear/editar */}
      <Modal
        open={open}
        title={draft?.id ? "Editar rol" : "Nuevo rol"}
        onClose={() => {
          setOpen(false);
          setDraft(null);
        }}
        wide
        actions={
          <>
            <Button variant="ghost" type="button" onClick={() => { setOpen(false); setDraft(null); }}>
              Cancelar
            </Button>
            <Button type="button" onClick={save}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Nombre</span>
            <Input
              value={draft?.name ?? ""}
              onChange={(e) => setDraft((p) => (p ? { ...p, name: e.target.value } : p))}
              placeholder="Ej: Administrador"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Descripción</span>
            <Input
              value={draft?.description ?? ""}
              onChange={(e) => setDraft((p) => (p ? { ...p, description: e.target.value } : p))}
              placeholder="Opcional"
            />
          </label>

          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-slate-600">Permisos (JSON)</span>
            <Textarea
              rows={10}
              value={draft?.permissionsText ?? ""}
              onChange={(e) => setDraft((p) => (p ? { ...p, permissionsText: e.target.value } : p))}
              placeholder='Ej: { "users": ["read","write"], "costos": ["read"] }'
            />
            <div className="text-xs text-slate-500">
              Tip: puedes guardar un objeto o un array. Ej: <code>{`{"users":["read"]}`}</code>
            </div>
          </label>
        </div>
      </Modal>

      {/* Confirm eliminar */}
      <ConfirmModal
        open={confirmOpen}
        loading={confirmLoading}
        title="Eliminar rol"
        message={
          toDelete
            ? `¿Eliminar el rol ${toDelete.name}?`
            : "¿Eliminar rol?"
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
        onConfirm={doDelete}
      />
    </DashboardShell>
  );
}
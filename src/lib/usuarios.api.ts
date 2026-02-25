// src/lib/usuarios.api.ts
import toast from "react-hot-toast";

/* ===================== Tipos ===================== */
export type Usuario = {
  id: number;
  email: string;
  nombre?: string | null;
  activo: boolean;

  // compat (backend devuelve roles[])
  roles: { id: number; name: string }[];

  // cómodo para UI 1 rol (si backend lo devuelve)
  roleId?: number | null;
  roleName?: string | null;

  // opcional si backend devuelve estos campos (como te los dejé en route)
  rol?: string;
  estado?: "Activo" | "Inactivo";

  createdAt?: string;
  updatedAt?: string;
};

type ListResp<T> = { items: T[] };

/* ===================== Helpers ===================== */
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

/* ===================== API ===================== */

// GET /api/users?q=
export async function getUsers(params?: { q?: string }): Promise<Usuario[]> {
  try {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    sp.set("ts", String(Date.now()));

    const res = await fetch(`/api/users?${sp.toString()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return items as Usuario[];
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando usuarios");
    return [];
  }
}

// POST /api/users
export async function createUser(data: {
  email: string;
  password: string;
  nombre?: string;
  activo?: boolean;

  // ✅ 1 rol
  roleId?: number;

  // compat (evitar usar, pero lo aceptamos)
  roleIds?: number[];
}): Promise<Usuario | null> {
  const t = toast.loading("Creando usuario...");
  try {
    // normaliza: si viene roleIds y no roleId -> toma el primero
    const payload: any = { ...data };
    if (!payload.roleId && Array.isArray(payload.roleIds) && payload.roleIds.length) {
      payload.roleId = payload.roleIds[0];
    }
    // evita mandar roleIds si ya mandamos roleId
    if (payload.roleId) delete payload.roleIds;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(payload),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Usuario creado ✅", { id: t });
    return body as Usuario;
  } catch (e: any) {
    toast.error(e?.message ?? "Error creando usuario", { id: t });
    return null;
  }
}

// PATCH /api/users/:id
export async function updateUser(
  id: number,
  data: Partial<{
    nombre: string;
    activo: boolean;

    // ✅ 1 rol
    roleId: number;

    // compat (evitar usar)
    roleIds: number[];
  }>
): Promise<Usuario | null> {
  const t = toast.loading("Guardando usuario...");
  try {
    const payload: any = { ...data };

    // normaliza compat
    if (!payload.roleId && Array.isArray(payload.roleIds) && payload.roleIds.length) {
      payload.roleId = payload.roleIds[0];
    }
    if (typeof payload.roleId !== "undefined") delete payload.roleIds;

    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(payload),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Usuario guardado ✅", { id: t });
    return body as Usuario;
  } catch (e: any) {
    toast.error(e?.message ?? "Error guardando usuario", { id: t });
    return null;
  }
}

// DELETE /api/users/:id
export async function deleteUser(id: number): Promise<boolean> {
  const t = toast.loading("Eliminando usuario...");
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Usuario eliminado ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message ?? "No se pudo eliminar", { id: t });
    return false;
  }
}
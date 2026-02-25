// src/lib/users.api.ts
import toast from "react-hot-toast";

export type UserDto = {
  id: number;
  email: string;
  nombre?: string | null;
  activo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;

  // convenience (si el backend lo devuelve)
  roles?: Array<{ id: number; name: string }>;
};

type ListResp<T> = { items: T[]; total?: number; page?: number; pageSize?: number };

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

/* ===================== USERS ===================== */

export async function getUsers(params?: { q?: string; page?: number; pageSize?: number }): Promise<ListResp<UserDto>> {
  try {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    sp.set("page", String(params?.page ?? 1));
    sp.set("pageSize", String(params?.pageSize ?? 50));
    sp.set("ts", String(Date.now()));

    const res = await fetch(`/api/users?${sp.toString()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return {
      items: items as UserDto[],
      total: Number(body?.total ?? items.length),
      page: Number(body?.page ?? 1),
      pageSize: Number(body?.pageSize ?? items.length),
    };
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando usuarios");
    return { items: [], total: 0, page: 1, pageSize: 50 };
  }
}

export async function createUser(data: {
  email: string;
  password: string;
  nombre?: string;
  activo?: boolean;
}): Promise<UserDto | null> {
  const t = toast.loading("Creando usuario...");
  try {
    const res = await fetch(`/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Usuario creado ✅", { id: t });
    return body as UserDto;
  } catch (e: any) {
    toast.error(e?.message ?? "Error creando usuario", { id: t });
    return null;
  }
}

export async function updateUser(
  id: number,
  data: Partial<{ email: string; password: string; nombre: string; activo: boolean }>
): Promise<UserDto | null> {
  const t = toast.loading("Actualizando usuario...");
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Usuario actualizado ✅", { id: t });
    return body as UserDto;
  } catch (e: any) {
    toast.error(e?.message ?? "Error actualizando usuario", { id: t });
    return null;
  }
}

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
    toast.error(e?.message ?? "No se pudo eliminar el usuario", { id: t });
    return false;
  }
}

/* ===================== ROLES ASSIGN ===================== */

// GET /api/users/:id/roles
export async function getUserRoles(userId: number): Promise<Array<{ id: number; name: string }>> {
  try {
    const res = await fetch(`/api/users/${userId}/roles?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return items as Array<{ id: number; name: string }>;
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando roles del usuario");
    return [];
  }
}

// PUT /api/users/:id/roles  { roleIds: number[] }
export async function setUserRoles(userId: number, roleIds: number[]): Promise<boolean> {
  const t = toast.loading("Asignando roles...");
  try {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify({ roleIds }),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Roles actualizados ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message ?? "No se pudo asignar roles", { id: t });
    return false;
  }
}

/**
 * Para tu UI actual (1 rol por usuario):
 * - setRolUnico(userId, roleId) => deja SOLO ese rol.
 */
export async function setRolUnico(userId: number, roleId: number | null): Promise<boolean> {
  return setUserRoles(userId, roleId ? [roleId] : []);
}
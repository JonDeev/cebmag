// src/lib/roles.api.ts
import toast from "react-hot-toast";

export type Role = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: any | null; // Json libre (obj/array)
  usersCount?: number; // viene del DTO del backend
};

type ListResp<T> = { items: T[]; total?: number; page?: number; pageSize?: number };

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

// GET /api/roles?q=
export async function getRoles(params?: { q?: string }): Promise<Role[]> {
  try {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    sp.set("ts", String(Date.now()));

    const res = await fetch(`/api/roles?${sp.toString()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return items as Role[];
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando roles");
    return [];
  }
}

// GET /api/roles/:id
export async function getRole(id: number): Promise<Role | null> {
  try {
    const res = await fetch(`/api/roles/${id}?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    return body as Role;
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando rol");
    return null;
  }
}

// POST /api/roles
export async function createRole(data: {
  name: string;
  description?: string;
  permissions?: any;
}): Promise<Role | null> {
  const t = toast.loading("Creando rol...");
  try {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Rol creado ✅", { id: t });
    return body as Role;
  } catch (e: any) {
    toast.error(e?.message ?? "Error creando rol", { id: t });
    return null;
  }
}

// PATCH /api/roles/:id
export async function updateRole(
  id: number,
  data: Partial<{ name: string; description: string; permissions: any }>
): Promise<Role | null> {
  const t = toast.loading("Guardando rol...");
  try {
    const res = await fetch(`/api/roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Rol guardado ✅", { id: t });
    return body as Role;
  } catch (e: any) {
    toast.error(e?.message ?? "Error guardando rol", { id: t });
    return null;
  }
}

/**
 * DELETE /api/roles/:id
 * Por defecto, backend puede bloquear si hay usuarios asignados.
 * Si quieres forzar: force=true => /api/roles/:id?force=1
 */
export async function deleteRole(id: number, opts?: { force?: boolean }): Promise<boolean> {
  const t = toast.loading("Eliminando rol...");
  try {
    const sp = new URLSearchParams();
    if (opts?.force) sp.set("force", "1");

    const url = sp.toString() ? `/api/roles/${id}?${sp.toString()}` : `/api/roles/${id}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    toast.success("Rol eliminado ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message ?? "No se pudo eliminar el rol", { id: t });
    return false;
  }
}
// src/lib/usuarios.api.ts
import toast from "react-hot-toast";

export type Usuario = {
  id: number;
  usuario: string;
  email: string;
  nombre?: string | null;
  activo: boolean;
  roles: { id: number; name: string }[];
  createdAt?: string;
  updatedAt?: string;
};

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

const API_BASE = "/api/usuarios"; // ✅ tu ruta real (no /api/users)

export async function getUsers(params?: { q?: string }): Promise<Usuario[]> {
  try {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    sp.set("page", "1");
    sp.set("pageSize", "200");
    sp.set("ts", String(Date.now()));

    const res = await fetch(`${API_BASE}?${sp.toString()}`, {
      cache: "no-store",
      credentials: "include",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    // tu GET devuelve: { total, page, pageSize, items: [...] }
    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return items as Usuario[];
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando usuarios");
    return [];
  }
}

export async function createUser(data: {
  usuario: string;
  email: string;
  password: string;
  nombre?: string;
  activo?: boolean;
  roleIds?: number[];
  roleId?: number;
}): Promise<Usuario | null> {
  const t = toast.loading("Creando usuario...");
  try {
    const payload: any = {
      ...data,
      // compat: algunos backends esperan "estado"
      ...(typeof data.activo === "boolean" ? { estado: data.activo ? "Activo" : "Inactivo" } : {}),
    };

    const res = await fetch(`${API_BASE}?ts=${Date.now()}`, {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache", pragma: "no-cache" },
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

export async function updateUser(
  id: number,
  data: Partial<{
    usuario: string;
    nombre: string;
    email: string;          // ✅ AHORA SÍ
    activo: boolean;
    roleIds: number[];
    roleId: number;
    password: string;
  }>
): Promise<Usuario | null> {
  const t = toast.loading("Guardando usuario...");
  try {
    const payload: any = {
      ...data,
      // compat: algunos backends esperan "estado"
      ...(typeof data.activo === "boolean" ? { estado: data.activo ? "Activo" : "Inactivo" } : {}),
    };

    const res = await fetch(`${API_BASE}/${id}?ts=${Date.now()}`, {
      method: "PATCH",
      cache: "no-store",
      credentials: "include",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache", pragma: "no-cache" },
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

export async function deleteUser(id: number): Promise<boolean> {
  const t = toast.loading("Eliminando usuario...");
  try {
    const res = await fetch(`${API_BASE}/${id}?ts=${Date.now()}`, {
      method: "DELETE",
      cache: "no-store",
      credentials: "include",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
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
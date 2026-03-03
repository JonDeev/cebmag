// src/lib/usuarios.api.ts
import toast from "react-hot-toast";

export type RolLite = { id: number; name: string };

export type Usuario = {
  id: number;

  usuario: string;
  email: string;

  // ✅ separados
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;

  // compatibilidad / display
  nombre?: string | null;

  activo: boolean;
  estado?: "Activo" | "Inactivo";

  rol?: string; // compat
  roles: RolLite[];

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

function pickItems(body: any): any[] {
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body)) return body;
  return [];
}

/** GET /api/usuarios?q= */
export async function getUsers(params?: { q?: string; page?: number; pageSize?: number }): Promise<Usuario[]> {
  try {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    sp.set("ts", String(Date.now()));

    const res = await fetch(`/api/usuarios?${sp.toString()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
      credentials: "include",
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    return pickItems(body) as Usuario[];
  } catch (e: any) {
    toast.error(e?.message ?? "Error cargando usuarios");
    return [];
  }
}

/** POST /api/usuarios */
export async function createUser(data: {
  usuario: string;
  email: string;
  password?: string; // si no envías, backend devuelve tempPassword
  activo?: boolean;
  estado?: string; // compat

  // ✅ separados
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;

  // compat
  nombre?: string;

  // roles
  roleIds?: number[];
  roleId?: number;
  rol?: string; // fallback por nombre
}): Promise<(Usuario & { tempPassword?: string }) | null> {
  const t = toast.loading("Creando usuario...");
  try {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    // Si backend devolvió tempPassword (cuando no mandaste password)
    if (body?.tempPassword) {
      toast(`Contraseña temporal: ${body.tempPassword}`, { duration: 9000 });
    }

    toast.success("Usuario creado ✅", { id: t });
    return body as Usuario & { tempPassword?: string };
  } catch (e: any) {
    toast.error(e?.message ?? "Error creando usuario", { id: t });
    return null;
  }
}

/** PATCH /api/usuarios/:id */
export async function updateUser(
  id: number,
  data: Partial<{
    usuario: string;
    email: string;
    activo: boolean;
    estado: string;

    // ✅ separados
    primerNombre: string | null;
    segundoNombre: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;

    // compat
    nombre: string | null;

    password: string;

    // roles
    roleIds: number[];
    roleId: number;
    rol: string;
  }>
): Promise<Usuario | null> {
  const t = toast.loading("Guardando usuario...");
  try {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      credentials: "include",
      body: JSON.stringify(data),
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

/** DELETE /api/usuarios/:id */
export async function deleteUser(id: number): Promise<boolean> {
  const t = toast.loading("Eliminando usuario...");
  try {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
      credentials: "include",
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
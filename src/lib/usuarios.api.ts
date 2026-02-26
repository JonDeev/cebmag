import toast from "react-hot-toast";

export type Usuario = {
  id: number;
  usuario: string;          // ✅ nuevo
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

export async function createUser(data: {
  usuario: string;          // ✅ nuevo
  email: string;
  password: string;
  nombre?: string;
  activo?: boolean;
  roleIds?: number[];
  roleId?: number;
}): Promise<Usuario | null> {
  const t = toast.loading("Creando usuario...");
  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
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
  data: Partial<{ usuario: string; nombre: string; activo: boolean; roleIds: number[]; roleId: number }>
): Promise<Usuario | null> {
  const t = toast.loading("Guardando usuario...");
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
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
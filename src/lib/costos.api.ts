// src/lib/costos.api.ts
import toast from "react-hot-toast";

/* ===================== Tipos ===================== */
export type EstadoActividad = "Abierta" | "Cerrada";

export type Actividad = {
  id: number;
  codigo: string;
  nombre: string;
  presupuesto: number;
  estado: EstadoActividad;
  cerradaEn?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MetodoPago = "Efectivo" | "Transferencia" | "Cheque" | "Otro";

export type GastoCategoria =
  | "Personal"
  | "Honorarios"
  | "Transporte"
  | "Insumos"
  | "Alquiler"
  | "Papelería"
  | "Logística"
  | "Otros";

export type GastoAdjunto = { name: string; size: number };

export type Gasto = {
  id: number;
  fecha: string; // YYYY-MM-DD
  actividadId: number;
  categoria: GastoCategoria | string;
  descripcion: string;
  proveedor?: string | null;
  metodo?: MetodoPago | string | null;
  documento?: string | null;
  valor: number;
  adjuntos: GastoAdjunto[];
  createdAt?: string;
  updatedAt?: string;
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

/* ===================== ACTIVIDADES ===================== */

// GET /api/costos/actividades
export async function getActividades(): Promise<Actividad[]> {
  try {
    const res = await fetch(`/api/costos/actividades?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });
    const data = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(data, `HTTP ${res.status}`));

    // soporte: {items:[...]} o [...]
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return items as Actividad[];
  } catch (e: any) {
    toast.error(e?.message ?? "Error al cargar actividades");
    return [];
  }
}

// POST /api/costos/actividades
export async function createActividad(data: {
  codigo: string;
  nombre: string;
  presupuesto?: number;
  estado?: EstadoActividad;
}): Promise<Actividad | null> {
  const t = toast.loading("Creando actividad...");
  try {
    const res = await fetch("/api/costos/actividades", {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
    toast.success("Actividad creada ✅", { id: t });
    return body as Actividad;
  } catch (e: any) {
    toast.error(e?.message ?? "Error creando actividad", { id: t });
    return null;
  }
}

/**
 * PATCH /api/costos/actividades
 * Acepta:
 *   - [{id, presupuesto?, estado?, nombre?}, ...]
 *   - { items: [...] }
 */
export async function patchActividades(
  items: Array<{ id: number; presupuesto?: number; estado?: EstadoActividad; nombre?: string }>
): Promise<Actividad[]> {
  const t = toast.loading("Guardando actividades...");
  try {
    const res = await fetch("/api/costos/actividades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify({ items }),
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    const out = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    toast.success("Actividades guardadas ✅", { id: t });
    return out as Actividad[];
  } catch (e: any) {
    toast.error(e?.message ?? "Error guardando actividades", { id: t });
    throw e;
  }
}

// DELETE /api/costos/actividades/[id]
export async function deleteActividad(id: number): Promise<boolean> {
  const t = toast.loading("Eliminando actividad...");
  try {
    const res = await fetch(`/api/costos/actividades/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
    toast.success("Actividad eliminada ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message ?? "No se pudo eliminar la actividad", { id: t });
    return false;
  }
}

/* ===================== GASTOS ===================== */

// GET /api/costos/gastos?q=&actividadId=&categoria=&d1=&d2=&page=&pageSize=
export async function getGastos(params: {
  q?: string;
  actividadId?: string | number;
  categoria?: string;
  d1?: string;
  d2?: string;
  page?: number;
  pageSize?: number;
}): Promise<ListResp<Gasto>> {
  try {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", String(params.q));
    if (params.actividadId) sp.set("actividadId", String(params.actividadId));
    if (params.categoria) sp.set("categoria", String(params.categoria));
    if (params.d1) sp.set("d1", String(params.d1));
    if (params.d2) sp.set("d2", String(params.d2));
    sp.set("page", String(params.page ?? 1));
    sp.set("pageSize", String(params.pageSize ?? 50));
    sp.set("ts", String(Date.now()));

    const res = await fetch(`/api/costos/gastos?${sp.toString()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

    // esperado: {items,total,page,pageSize}
    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return {
      items: items as Gasto[],
      total: Number(body?.total ?? items.length),
      page: Number(body?.page ?? 1),
      pageSize: Number(body?.pageSize ?? items.length),
    };
  } catch (e: any) {
    toast.error(e?.message ?? "Error al cargar gastos");
    return { items: [], total: 0, page: 1, pageSize: 50 };
  }
}

// POST /api/costos/gastos
export async function createGasto(data: Omit<Gasto, "id">): Promise<Gasto | null> {
  const t = toast.loading("Creando gasto...");
  try {
    const res = await fetch("/api/costos/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
    toast.success("Gasto creado ✅", { id: t });
    return body as Gasto;
  } catch (e: any) {
    toast.error(e?.message ?? "Error creando gasto", { id: t });
    return null;
  }
}

// PATCH /api/costos/gastos/[id]
export async function updateGasto(id: number, data: Partial<Omit<Gasto, "id">>): Promise<Gasto | null> {
  const t = toast.loading("Actualizando gasto...");
  try {
    const res = await fetch(`/api/costos/gastos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(data),
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
    toast.success("Gasto actualizado ✅", { id: t });
    return body as Gasto;
  } catch (e: any) {
    toast.error(e?.message ?? "Error actualizando gasto", { id: t });
    return null;
  }
}

// DELETE /api/costos/gastos/[id]
export async function deleteGasto(id: number): Promise<boolean> {
  const t = toast.loading("Eliminando gasto...");
  try {
    const res = await fetch(`/api/costos/gastos/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
    toast.success("Gasto eliminado ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message ?? "Error eliminando gasto", { id: t });
    return false;
  }
}
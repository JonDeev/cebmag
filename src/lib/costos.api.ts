import toast from "react-hot-toast";

export type EstadoAct = "Abierta" | "Cerrada";

export type Actividad = {
  id: number;
  codigo: string;
  nombre: string;
  presupuesto: number;
  estado: EstadoAct;
  cerradaEn?: string | null;
};

export type Metodo = "Efectivo" | "Transferencia" | "Cheque" | "Otro" | "";
export type Categoria =
  | "Personal"
  | "Honorarios"
  | "Transporte"
  | "Insumos"
  | "Alquiler"
  | "Papelería"
  | "Logística"
  | "Otros";

export type Gasto = {
  id: number;
  fecha: string; // YYYY-MM-DD
  actividadId: number;
  categoria: Categoria | string;
  descripcion: string;
  proveedor?: string;
  metodo?: Metodo;
  documento?: string;
  valor: number;
  adjuntos: { name: string; size: number }[];
};

export async function getActividades() {
  const res = await fetch(`/api/costos/actividades?ts=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return (json.items || []) as Actividad[];
}

export async function patchActividades(items: Array<Partial<Actividad> & { id: number }>) {
  const res = await fetch(`/api/costos/actividades`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return (json.items || []) as Actividad[];
}

export async function getGastos(params: {
  q?: string;
  actividadId?: number | string;
  categoria?: string;
  d1?: string;
  d2?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.actividadId) sp.set("actividadId", String(params.actividadId));
  if (params.categoria) sp.set("categoria", params.categoria);
  if (params.d1) sp.set("d1", params.d1);
  if (params.d2) sp.set("d2", params.d2);
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 200));
  sp.set("ts", String(Date.now()));

  const res = await fetch(`/api/costos/gastos?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ total: number; page: number; pageSize: number; items: Gasto[] }>;
}

export async function createGasto(data: Omit<Gasto, "id">) {
  const t = toast.loading("Guardando gasto...");
  try {
    const res = await fetch(`/api/costos/gastos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(raw);
    toast.success("Gasto guardado ✅", { id: t });
    return JSON.parse(raw) as Gasto;
  } catch (e: any) {
    toast.error(e?.message ?? "Error guardando gasto", { id: t });
    return null;
  }
}

export async function updateGasto(id: number, data: Partial<Gasto>) {
  const t = toast.loading("Actualizando gasto...");
  try {
    const res = await fetch(`/api/costos/gastos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(raw);
    toast.success("Gasto actualizado ✅", { id: t });
    return JSON.parse(raw) as Gasto;
  } catch (e: any) {
    toast.error(e?.message ?? "Error actualizando gasto", { id: t });
    return null;
  }
}

export async function deleteGasto(id: number) {
  const t = toast.loading("Eliminando...");
  try {
    const res = await fetch(`/api/costos/gastos/${id}`, { method: "DELETE" });
    const raw = await res.text();
    if (!res.ok) throw new Error(raw);
    toast.success("Eliminado ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message ?? "Error eliminando", { id: t });
    return false;
  }
}
import toast from "react-hot-toast";

/* ===================== Tipos (UI) ===================== */
export type Estado = "Pendiente" | "Parcial" | "Entregado";

export type Item = { id: string; nombre: string; unidad: string; cantidad: number };
export type Adj = { name: string; size: number };

export type TipoDoc = "CC" | "TI" | "CE" | "RC" | "PA" | "PEP" | "PPT" | "NIT" | "OTRO";

export type BeneficiarioUI = {
tipo_doc?: TipoDoc;
  doc: string;
  nombre: string;
};

export type Entrega = {
  id: number; // ✅ Int en Prisma
  comprobante: string;
  fecha: string; // YYYY-MM-DD
  beneficiario: BeneficiarioUI;
  direccion?: string;
  responsable: string;
  estado: Estado;
  kit?: string;
  items: Item[];
  observaciones?: string;
  adjuntos: Adj[];
};

export type ListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: Entrega[];
};

export type ListParams = {
  q?: string;
  estado?: "" | Estado;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

/* ===================== Helpers ===================== */
function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    sp.set(k, s);
  });
  sp.set("ts", String(Date.now()));
  return sp.toString();
}

async function readJson(res: Response) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function errorMsg(data: any, fallback: string) {
  return (typeof data === "object" ? data?.error || data?.message : data) || fallback;
}

/* ===================== API ===================== */

export async function getEntregas(params: ListParams = {}): Promise<ListResponse> {
  try {
    const res = await fetch(`/api/entregas?${qs({
      q: params.q ?? "",
      estado: params.estado ?? "",
      from: params.from ?? "",
      to: params.to ?? "",
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 200,
    })}`, { cache: "no-store" });

    const data = await readJson(res);

    if (!res.ok) {
      throw new Error(errorMsg(data, "Error al cargar entregas"));
    }

    return (data ?? { total: 0, page: 1, pageSize: 200, items: [] }) as ListResponse;
  } catch (e: any) {
    toast.error(e?.message || "Error al listar entregas");
    return { total: 0, page: 1, pageSize: 200, items: [] };
  }
}

export async function createEntrega(payload: Partial<Entrega> & {
  // opcional: si quieres enviar id directo
  beneficiarioId?: number | null;
}): Promise<Entrega | null> {
  const t = toast.loading("Guardando entrega...");
  try {
    const res = await fetch(`/api/entregas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(payload),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(errorMsg(data, await res.text()));

    toast.success("Entrega creada ✅", { id: t });
    return data as Entrega;
  } catch (e: any) {
    toast.error(e?.message || "Error creando entrega", { id: t });
    return null;
  }
}

export async function updateEntrega(id: number, payload: Partial<Entrega> & {
  beneficiarioId?: number | null;
}): Promise<Entrega | null> {
  const t = toast.loading("Actualizando entrega...");
  try {
    const res = await fetch(`/api/entregas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify(payload),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(errorMsg(data, await res.text()));

    toast.success("Entrega actualizada ✅", { id: t });
    return data as Entrega;
  } catch (e: any) {
    toast.error(e?.message || "Error actualizando entrega", { id: t });
    return null;
  }
}

export async function deleteEntrega(id: number): Promise<boolean> {
  const t = toast.loading("Eliminando entrega...");
  try {
    const res = await fetch(`/api/entregas/${id}`, { method: "DELETE" });
    const data = await readJson(res);

    if (!res.ok) throw new Error(errorMsg(data, "Error eliminando entrega"));

    toast.success("Entrega eliminada ✅", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message || "Error eliminando entrega", { id: t });
    return false;
  }
}
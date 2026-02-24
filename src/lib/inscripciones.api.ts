import toast from "react-hot-toast";

type Id = number;

export type Estado =
  | "En evaluación"
  | "Aprobada"
  | "Rechazada"
  | "Contrato generado"
  | "Firmado";

export type TipoPersonal = "Administrativo" | "Asistencial";

export type Modalidad = "Prestación de servicios" | "Temporal" | "Indefinido";
export type Jornada = "Tiempo completo" | "Medio tiempo" | "Por horas";

export type Inscripcion = {
  id: Id;
  radicado: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoPersonal;

  candidato: {
    doc: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    // si luego agregas tipo_doc, aquí lo ponemos
    tipo_doc?: string;
  };

  cargo: string;
  actividad: string;
  estado: Estado;

  evaluacion: {
    puntaje: number;
    docsOk: { cv: boolean; doc: boolean; certificados: boolean; rut: boolean };
    concepto: string;
    decision?: "Aprobar" | "Rechazar";
  };

  contrato?: {
    modalidad: Modalidad;
    jornada: Jornada;
    salarioTipo: "Salario" | "Honorarios";
    valor: number;
    periodo: "Mensual" | "Quincenal" | "Por servicio";
    inicio: string;
    fin?: string;
    descripcion?: string;
  };

  adjuntos: { name: string; size: number }[];
};

export type ListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: Inscripcion[];
};

async function parseBody(res: Response) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function errMsg(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data?.error || data?.message || fallback;
}

/* ===================== LISTAR ===================== */
/**
 * GET /api/inscripciones?q=&estado=&tipo=&page=&pageSize=
 */
export async function getInscripciones(params?: {
  q?: string;
  estado?: Estado | "";
  tipo?: TipoPersonal | "";
  page?: number;
  pageSize?: number;
}) {
  try {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.estado) sp.set("estado", params.estado);
    if (params?.tipo) sp.set("tipo", params.tipo);
    sp.set("page", String(params?.page ?? 1));
    sp.set("pageSize", String(params?.pageSize ?? 50));

    const res = await fetch(`/api/inscripciones?${sp.toString()}&ts=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });

    const data = await parseBody(res);
    if (!res.ok) throw new Error(errMsg(data, "Error al cargar inscripciones"));

    return data as ListResponse;
  } catch (e: any) {
    toast.error(e?.message || "Error al listar inscripciones");
    return { total: 0, page: 1, pageSize: 50, items: [] } as ListResponse;
  }
}

/* ===================== DETALLE ===================== */
/**
 * GET /api/inscripciones/[id]
 */
export async function getInscripcion(id: Id) {
  try {
    const res = await fetch(`/api/inscripciones/${id}?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    });

    const data = await parseBody(res);
    if (!res.ok) throw new Error(errMsg(data, "Error al obtener inscripción"));

    return data as Inscripcion;
  } catch (e: any) {
    toast.error(e?.message || "Error al obtener inscripción");
    return null;
  }
}

/* ===================== CREAR ===================== */
/**
 * POST /api/inscripciones
 */
export async function createInscripcion(payload: Omit<Partial<Inscripcion>, "id">) {
  const t = toast.loading("Creando inscripción...");
  try {
    const res = await fetch("/api/inscripciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseBody(res);
    if (!res.ok) throw new Error(errMsg(data, "Error al crear inscripción"));

    toast.success("Inscripción creada", { id: t });
    return data as Inscripcion;
  } catch (e: any) {
    toast.error(e?.message || "Error al crear inscripción", { id: t });
    return null;
  }
}

/* ===================== ACTUALIZAR ===================== */
/**
 * PATCH /api/inscripciones/[id]
 */
export async function updateInscripcion(id: Id, patch: Partial<Inscripcion>) {
  const t = toast.loading("Guardando cambios...");
  try {
    const res = await fetch(`/api/inscripciones/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify(patch),
    });

    const data = await parseBody(res);
    if (!res.ok) throw new Error(errMsg(data, "Error al actualizar inscripción"));

    toast.success("Inscripción actualizada", { id: t });
    return data as Inscripcion;
  } catch (e: any) {
    toast.error(e?.message || "Error al actualizar inscripción", { id: t });
    return null;
  }
}

/* ===================== ELIMINAR ===================== */
/**
 * DELETE /api/inscripciones/[id]
 */
export async function deleteInscripcion(id: Id) {
  const t = toast.loading("Eliminando...");
  try {
    const res = await fetch(`/api/inscripciones/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });

    const data = await parseBody(res);
    if (!res.ok) throw new Error(errMsg(data, "Error al eliminar inscripción"));

    toast.success("Inscripción eliminada", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message || "Error al eliminar inscripción", { id: t });
    return false;
  }
}
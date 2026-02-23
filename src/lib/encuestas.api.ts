import toast from "react-hot-toast";

type Id = number | string;

type TipoDoc = "CC" | "TI" | "CE" | "RC" | "PA" | "PEP" | "PPT" | "NIT" | "OTRO";

type Respondente = {
  tipo_doc?: TipoDoc;
  doc?: string;        // documento
  documento?: string;  // alias por compatibilidad
  nombre?: string;

  // extras (si luego quieres usar)
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
};

/* ===================== Listar ===================== */
export async function getEncuestas() {
  try {
    const res = await fetch(`/api/encuestas?ts=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });
    if (!res.ok) throw new Error("Error al cargar encuestas");
    return await res.json();
  } catch (e: any) {
    toast.error(e?.message || "Error al listar encuestas");
    return [];
  }
}

/* ===================== Crear ===================== */
export async function createEncuesta(data: any) {
  const t = toast.loading("Guardando encuesta...");
  try {
    const res = await fetch("/api/encuestas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify(data),
    });
    const raw = await res.text();
    const json = raw ? JSON.parse(raw) : null;

    if (!res.ok) throw new Error(json?.error || json?.message || raw || "Error al crear encuesta");

    toast.success("Encuesta creada correctamente", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e?.message || "Error al crear encuesta", { id: t });
    return null;
  }
}

/* ===================== Actualizar ===================== */
export async function updateEncuesta(id: Id, data: any) {
  const t = toast.loading("Actualizando encuesta...");
  try {
    const res = await fetch(`/api/encuestas/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify(data),
    });

    const raw = await res.text();
    const json = raw ? JSON.parse(raw) : null;

    if (!res.ok) throw new Error(json?.error || json?.message || raw || "Error al actualizar encuesta");

    toast.success("Encuesta actualizada correctamente", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e?.message || "Error al actualizar encuesta", { id: t });
    return null;
  }
}

/* ===================== Eliminar ===================== */
export async function deleteEncuesta(id: Id) {
  const t = toast.loading("Eliminando encuesta...");
  try {
    const res = await fetch(`/api/encuestas/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!res.ok) throw new Error(data?.error || data?.message || raw || "Error al eliminar encuesta");

    toast.success("Encuesta eliminada", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message || "Error al eliminar encuesta", { id: t });
    return false;
  }
}

/* ===================== Guardar respuesta ===================== */
export async function saveRespuesta(r: {
  encuestaId: Id;
  respondente?: Respondente;
  valores: Record<string, any>;
}) {
  const resp = r.respondente ?? {};

  // ✅ normaliza documento
  const tipo_doc = resp.tipo_doc ?? "CC";
  const documento = (resp.doc ?? resp.documento ?? "").toString();
  const nombre = (resp.nombre ?? "").toString();

  const res = await fetch(`/api/encuestas/${r.encuestaId}/respuestas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    // ✅ Mandamos PLANO (para backend nuevo) + respondente (compat)
    body: JSON.stringify({
      tipo_doc,
      documento,
      nombre,
      valores: r.valores ?? {},

      // compat (por si tu backend aún esperaba esto)
      respondente: {
        tipo_doc,
        doc: documento,
        nombre,
      },
    }),
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    const message =
      (typeof data === "object" ? data?.error || data?.message : data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

/* ===================== Resultados ===================== */
export async function getResultados(id: Id) {
  try {
    const res = await fetch(`/api/encuestas/${id}/resultados?ts=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });
    if (!res.ok) throw new Error("Error al obtener resultados");
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
}
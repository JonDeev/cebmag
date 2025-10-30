import toast from "react-hot-toast";

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
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json(); // ← debería incluir preguntas
    toast.success("Encuesta creada correctamente", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e?.message || "Error al crear encuesta", { id: t });
    return null;
  }
}

/* ===================== Actualizar ===================== */
export async function updateEncuesta(id: string, data: any) {
  const t = toast.loading("Actualizando encuesta...");
  try {
    const res = await fetch(`/api/encuestas/${id}`, {
      method: "PATCH", // usa PATCH como en tu backend
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json(); // ← debería incluir preguntas actualizadas
    toast.success("Encuesta actualizada correctamente", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e?.message || "Error al actualizar encuesta", { id: t });
    return null;
  }
}

/* ===================== Eliminar ===================== */
export async function deleteEncuesta(id: string) {
  const t = toast.loading("Eliminando encuesta...");
  try {
    const res = await fetch(`/api/encuestas/${id}`, {
      method: "DELETE",
      headers: { "cache-control": "no-cache" },
    });
    if (!res.ok) throw new Error(await res.text());
    toast.success("Encuesta eliminada", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e?.message || "Error al eliminar encuesta", { id: t });
    return false;
  }
}

/* ===================== Guardar respuesta ===================== */
export async function saveRespuesta(r: {
  encuestaId: string;
  respondente?: { tipo_doc?: "CC" | "TI" | "CE" | "RC" | "PA"; doc?: string; nombre?: string };
  valores: Record<string, any>;
}) {
  const res = await fetch(`/api/encuestas/${r.encuestaId}/respuestas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      respondente: r.respondente ?? {},
      valores: r.valores ?? {},
    }),
  });

  // Leemos el cuerpo siempre (texto) para no perder el mensaje del backend
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw; // si no es JSON, dejamos el texto crudo
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
export async function getResultados(id: string) {
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

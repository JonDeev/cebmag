import toast from "react-hot-toast";

// ===== Listar =====
export async function getEncuestas() {
  try {
    const res = await fetch("/api/encuestas", { cache: "no-store" });
    if (!res.ok) throw new Error("Error al cargar encuestas");
    return await res.json();
  } catch (e: any) {
    toast.error(e.message || "Error al listar encuestas");
    return [];
  }
}

// ===== Crear =====
export async function createEncuesta(data: any) {
  const t = toast.loading("Guardando encuesta...");
  try {
    const res = await fetch("/api/encuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al guardar");
    const json = await res.json();
    toast.success("Encuesta creada correctamente", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e.message || "Error al crear encuesta", { id: t });
    return null;
  }
}

// ===== Actualizar =====
export async function updateEncuesta(id: string, data: any) {
  const t = toast.loading("Actualizando encuesta...");
  try {
    const res = await fetch(`/api/encuestas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar");
    const json = await res.json();
    toast.success("Encuesta actualizada correctamente", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e.message || "Error al actualizar encuesta", { id: t });
    return null;
  }
}

// ===== Eliminar =====
export async function deleteEncuesta(id: string) {
  const t = toast.loading("Eliminando encuesta...");
  try {
    const res = await fetch(`/api/encuestas/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar");
    toast.success("Encuesta eliminada", { id: t });
    return true;
  } catch (e: any) {
    toast.error(e.message || "Error al eliminar encuesta", { id: t });
    return false;
  }
}

// ===== Guardar respuesta =====
export async function saveRespuesta(data: any) {
  const t = toast.loading("Guardando respuesta...");
  try {
    const res = await fetch("/api/encuestas/respuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al registrar respuesta");
    const json = await res.json();
    toast.success("Respuesta registrada", { id: t });
    return json;
  } catch (e: any) {
    toast.error(e.message || "Error al guardar respuesta", { id: t });
    return null;
  }
}

// ===== Resultados Encuestas =====

export async function getResultados(id: string) {
  try {
    const res = await fetch(`/api/encuestas/${id}/resultados`, { cache: "no-store" });
    if (!res.ok) throw new Error("Error al obtener resultados");
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
}


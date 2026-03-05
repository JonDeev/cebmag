export const dynamic = "force-dynamic";

/** YYYY-MM-DD */
export function toYMD(v: any) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function startOfDayUTC(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}
export function endOfDayUTC(ymd: string) {
  return new Date(`${ymd}T23:59:59.999Z`);
}

export function split2(s: string) {
  const parts = String(s || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { a: "", b: "" };
  if (parts.length === 1) return { a: parts[0], b: "" };
  return { a: parts[0], b: parts.slice(1).join(" ") };
}

export function calcEdad(fechaNacimiento: Date | null | undefined, hoy = new Date()): number | "" {
  if (!fechaNacimiento) return "";
  const dn = new Date(fechaNacimiento);
  if (Number.isNaN(dn.getTime())) return "";
  let age = hoy.getFullYear() - dn.getFullYear();
  const m = hoy.getMonth() - dn.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < dn.getDate())) age--;
  return age < 0 ? "" : age;
}

export function beneficiarioNombre(b: any) {
  if (!b) return "";
  const sep =
    [b?.primerNombre, b?.segundoNombre].filter(Boolean).join(" ").trim() ||
    String(b?.nombres ?? "").trim();
  const sepA =
    [b?.primerApellido, b?.segundoApellido].filter(Boolean).join(" ").trim() ||
    String(b?.apellidos ?? "").trim();
  const full = `${sep} ${sepA}`.trim();
  return full || "";
}

export function normKey(v: any) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const CAT_UI: Record<string, string> = {
  PERSONAL: "Personal",
  HONORARIOS: "Honorarios",
  TRANSPORTE: "Transporte",
  INSUMOS: "Insumos",
  ALQUILER: "Alquiler",
  PAPELERIA: "Papelería",
  LOGISTICA: "Logística",
  OTROS: "Otros",
};

export const METODO_UI: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  CHEQUE: "Cheque",
  OTRO: "Otro",
};

export function entregaEstadoToUi(v: any) {
  const k = normKey(v);
  if (k === "PENDIENTE") return "Pendiente";
  if (k === "PARCIAL") return "Parcial";
  if (k === "ENTREGADO" || k === "ENTREGADA") return "Entregado";
  return String(v ?? "");
}

export function pqrsStatusToUi(v: any) {
  const k = normKey(v);
  if (k === "ABIERTA") return "Abierta";
  if (k === "EN_TRAMITE") return "En trámite";
  if (k === "RE_ABIERTO" || k === "REABIERTO") return "Re Abierto";
  if (k === "CERRADA") return "Cerrada";
  return String(v ?? "");
}
export function pqrsTipoToUi(v: any) {
  const k = normKey(v);
  if (k === "PETICION") return "Petición";
  if (k === "QUEJA") return "Queja";
  if (k === "RECLAMO") return "Reclamo";
  if (k === "SUGERENCIA") return "Sugerencia";
  return String(v ?? "");
}
export function pqrsOrigenToUi(v: any) {
  const k = normKey(v);
  if (k === "BENEFICIARIO") return "Beneficiario";
  if (k === "TERCERO") return "Tercero";
  return String(v ?? "");
}
export function pqrsCanalToUi(v: any) {
  const k = normKey(v);
  if (k === "WEB") return "Web";
  if (k === "TELEFONO") return "Teléfono";
  if (k === "PRESENCIAL") return "Presencial";
  if (k === "EMAIL") return "Email";
  return String(v ?? "");
}

export function solicitanteLabel(s: any) {
  if (!s || typeof s !== "object") return "";
  const nombre =
    String(s?.nombre ?? "").trim() ||
    `${String(s?.nombres ?? "").trim()} ${String(s?.apellidos ?? "").trim()}`.trim();
  const doc = String(s?.doc ?? s?.documento ?? "").trim();
  return [nombre, doc ? `(${doc})` : ""].filter(Boolean).join(" ");
}

export function safeJsonString(v: any) {
  if (!v) return "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function itemsToText(items: any): string {
  if (!items) return "";

  // Normalizamos a array
  const arr = Array.isArray(items)
    ? items
    : typeof items === "object" && Array.isArray((items as any)?.items)
    ? (items as any).items
    : [items];

  const parts = arr
    .map((it: any) => {
      const nombre = String(it?.nombre ?? it?.item ?? it?.producto ?? it?.name ?? "").trim();
      const cantidad =
        it?.cantidadEntregada ??
        it?.cantidad ??
        it?.qty ??
        it?.cantidad_entregada ??
        it?.cantidad_total ??
        "";
      const unidad = String(it?.unidad ?? it?.unit ?? "").trim();
      const opcional = it?.opcional === true;

      if (!nombre) return "";

      const cantTxt = cantidad !== "" && Number.isFinite(Number(cantidad)) ? `x${Number(cantidad)}` : "";
      const uniTxt = unidad ? unidad : "";
      const opcTxt = opcional ? "(Opcional)" : "";

      return [nombre, cantTxt, uniTxt, opcTxt].filter(Boolean).join(" ").trim();
    })
    .filter(Boolean);

  if (parts.length) return parts.join("; ");

  try {
    return JSON.stringify(items);
  } catch {
    return String(items);
  }
}
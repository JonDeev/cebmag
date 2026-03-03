// src/app/api/beneficiarios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, Sexo, Zona, GrupoRH, DiscapacidadTipo, TipoDocumento } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Next 15: params puede venir como Promise */
async function getIdParam(ctx: { params: any }) {
  const p = await ctx.params;
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) return null;
  return id;
}

function clean(v: any) {
  return String(v ?? "").trim();
}

function cleanString(v: any) {
  if (v === null) return null;
  if (typeof v === "undefined") return undefined;
  const t = clean(v);
  return t === "" ? undefined : t;
}

function normKey(v: any) {
  return clean(v)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function joinParts(...parts: Array<string | null | undefined>) {
  return parts
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function split2(full: any): { a: string; b: string } {
  const s = clean(full);
  if (!s) return { a: "", b: "" };
  const parts = s.split(/\s+/).filter(Boolean);
  return { a: parts[0] ?? "", b: parts.slice(1).join(" ") ?? "" };
}

function isTipoDocumento(t: string): t is TipoDocumento {
  return (Object.values(TipoDocumento) as string[]).includes(t);
}

const mapSexo = (s?: any): Sexo | null | undefined => {
  if (s === null) return null;
  if (typeof s === "undefined") return undefined;
  const k = normKey(s);
  if (!k) return undefined;
  if (k.startsWith("FEM")) return Sexo.FEMENINO;
  if (k.startsWith("MAS")) return Sexo.MASCULINO;
  if (k === "OTRO") return Sexo.OTRO;
  // si llega "Otro / Prefiere no decir"
  return Sexo.OTRO;
};

const mapZona = (z?: any): Zona | null | undefined => {
  if (z === null) return null;
  if (typeof z === "undefined") return undefined;
  const k = normKey(z);
  if (!k) return undefined;
  if (k.startsWith("U")) return Zona.URBANA;
  if (k.startsWith("R")) return Zona.RURAL;
  return undefined;
};

const mapRH = (rh?: any): GrupoRH | null | undefined => {
  if (rh === null) return null;
  if (typeof rh === "undefined") return undefined;

  const v = normKey(rh).replace(/\s+/g, "");
  if (!v) return undefined;

  const map: Record<string, GrupoRH> = {
    "O+": GrupoRH.O_POS,
    "O-": GrupoRH.O_NEG,
    "A+": GrupoRH.A_POS,
    "A-": GrupoRH.A_NEG,
    "B+": GrupoRH.B_POS,
    "B-": GrupoRH.B_NEG,
    "AB+": GrupoRH.AB_POS,
    "AB-": GrupoRH.AB_NEG,

    O_POS: GrupoRH.O_POS,
    O_NEG: GrupoRH.O_NEG,
    A_POS: GrupoRH.A_POS,
    A_NEG: GrupoRH.A_NEG,
    B_POS: GrupoRH.B_POS,
    B_NEG: GrupoRH.B_NEG,
    AB_POS: GrupoRH.AB_POS,
    AB_NEG: GrupoRH.AB_NEG,
  };

  // ✅ si no coincide, NO lo borres
  return map[v] ?? undefined;
};

const mapDiscapacidad = (d?: any): DiscapacidadTipo | null | undefined => {
  if (d === null) return null;
  if (typeof d === "undefined") return undefined;

  const t = clean(d).toLowerCase();
  if (!t) return undefined;

  if (t.includes("ninguna")) return DiscapacidadTipo.NINGUNA;
  if (t.includes("visual")) return DiscapacidadTipo.VISUAL;
  if (t.includes("audit")) return DiscapacidadTipo.AUDITIVA;
  if (t.includes("motor")) return DiscapacidadTipo.MOTORA;
  if (t.includes("cogn")) return DiscapacidadTipo.COGNITIVA;
  if (t.includes("otra")) return DiscapacidadTipo.OTRA;

  return undefined;
};

const coerceDate = (s?: any) => {
  if (s === null) return null;
  if (typeof s === "undefined") return undefined;
  const t = clean(s);
  if (!t) return undefined;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const toYMD = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/** UI mapper (devuelve separados + concatenados) */
function toUi(b: any) {
  const pn = b?.primerNombre ?? "";
  const sn = b?.segundoNombre ?? "";
  const pa = b?.primerApellido ?? "";
  const sa = b?.segundoApellido ?? "";

  const nombres = joinParts(pn, sn) || String(b?.nombres ?? "").trim();
  const apellidos = joinParts(pa, sa) || String(b?.apellidos ?? "").trim();

  return {
    id: b.id,

    tipo_doc: b.tipoDoc,
    num_doc: b.doc,
    fecha_nac: toYMD(b.fechaNacimiento),

    // ✅ nuevos
    primer_nombre: pn || "",
    segundo_nombre: sn || "",
    primer_apellido: pa || "",
    segundo_apellido: sa || "",

    // ✅ compat
    nombres: nombres || "",
    apellidos: apellidos || "",

    sexo: b.sexo ? String(b.sexo) : "",
    direccion: b.direccion ?? "",
    barrio: b.barrio ?? "",
    ciudad: b.ciudad ?? "",
    dpto: b.departamento ?? "",
    zona: b.zona ? String(b.zona) : "",

    telefono: b.telefono ?? "",
    celular: b.celular ?? "",
    email: b.email ?? "",

    eps: b.eps ?? "",
    rh: b.rh ? String(b.rh) : "",
    discapacidad: b.discapacidad ? String(b.discapacidad) : "",

    alergias: b.alergias ?? "",
    medicamentos: b.medicamentos ?? "",
    antecedentes: b.antecedentes ?? "",

    comunidad: b.comunidad ?? "",
    lengua: b.lengua ?? "",
    practicas: b.practicasCulturales ?? "",

    urg_nombre: b.urgenciaNombre ?? "",
    urg_parentesco: b.urgenciaParentesco ?? "",
    urg_tel: b.urgenciaTelefono ?? "",
    urg_dir: b.urgenciaDireccion ?? "",

    acudientes: Array.isArray(b.acudientes) ? b.acudientes : [],
    docs: Array.isArray(b.docs) ? b.docs : [],

    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    activo: typeof b.activo === "boolean" ? b.activo : true,
  };
}

/** PATCH: acepta payload UI o “modelo”, sin defaults */
function mapPayloadUpdate(body: any): Prisma.BeneficiarioUpdateInput {
  const data: Prisma.BeneficiarioUpdateInput = {};

  // =========================
  // DOC / TIPO DOC
  // =========================
  if (typeof body.tipoDoc !== "undefined" || typeof body.tipo_doc !== "undefined") {
    const t = clean(body.tipoDoc ?? body.tipo_doc);
    if (t && isTipoDocumento(t)) data.tipoDoc = t as TipoDocumento;
  }

  if (typeof body.doc !== "undefined" || typeof body.num_doc !== "undefined") {
    const d = cleanString(body.doc ?? body.num_doc);
    if (typeof d === "string") data.doc = d.toUpperCase() as any;
    if (d === null) data.doc = null as any;
  }

  // =========================
  // NOMBRES SEPARADOS (nuevo)
  // acepta camelCase y snake_case
  // =========================
  const pn = cleanString(body.primerNombre ?? body.primer_nombre);
  const sn = cleanString(body.segundoNombre ?? body.segundo_nombre);
  const pa = cleanString(body.primerApellido ?? body.primer_apellido);
  const sa = cleanString(body.segundoApellido ?? body.segundo_apellido);

  const touchedSplit =
    typeof body.primerNombre !== "undefined" ||
    typeof body.primer_nombre !== "undefined" ||
    typeof body.segundoNombre !== "undefined" ||
    typeof body.segundo_nombre !== "undefined" ||
    typeof body.primerApellido !== "undefined" ||
    typeof body.primer_apellido !== "undefined" ||
    typeof body.segundoApellido !== "undefined" ||
    typeof body.segundo_apellido !== "undefined";

  if (touchedSplit) {
    // ✅ si llegan explícitos, se guardan tal cual
    if (typeof pn !== "undefined") (data as any).primerNombre = pn;
    if (typeof sn !== "undefined") (data as any).segundoNombre = sn;
    if (typeof pa !== "undefined") (data as any).primerApellido = pa;
    if (typeof sa !== "undefined") (data as any).segundoApellido = sa;
  }

  // =========================
  // COMPAT: nombres / apellidos
  // si NO tocaron los 4 nuevos pero mandan nombres/apellidos,
  // los partimos para llenar primer/segundo (mejor esfuerzo)
  // =========================
  if (!touchedSplit) {
    if (typeof body.nombres !== "undefined") {
      const val = cleanString(body.nombres);
      if (typeof val !== "undefined") {
        const { a, b } = split2(val);
        (data as any).primerNombre = a || null;
        (data as any).segundoNombre = b || null;
        // opcional: mantener campo viejo si existe
        if ("nombres" in (Prisma as any).BeneficiarioUpdateInput) (data as any).nombres = val as any;
      }
    }
    if (typeof body.apellidos !== "undefined") {
      const val = cleanString(body.apellidos);
      if (typeof val !== "undefined") {
        const { a, b } = split2(val);
        (data as any).primerApellido = a || null;
        (data as any).segundoApellido = b || null;
        if ("apellidos" in (Prisma as any).BeneficiarioUpdateInput) (data as any).apellidos = val as any;
      }
    }
  } else {
    // si tocaron split, opcionalmente también recalcular nombres/apellidos legacy si llegan
    if (typeof body.nombres !== "undefined") (data as any).nombres = cleanString(body.nombres) as any;
    if (typeof body.apellidos !== "undefined") (data as any).apellidos = cleanString(body.apellidos) as any;
  }

  // =========================
  // Fechas / enums
  // =========================
  if (typeof body.fechaNacimiento !== "undefined" || typeof body.fecha_nac !== "undefined") {
    data.fechaNacimiento = coerceDate(body.fechaNacimiento ?? body.fecha_nac) as any;
  }

  if (typeof body.sexo !== "undefined") data.sexo = mapSexo(body.sexo) as any;
  if (typeof body.zona !== "undefined") data.zona = mapZona(body.zona) as any;

  if (typeof body.rh !== "undefined") data.rh = mapRH(body.rh) as any;
  if (typeof body.discapacidad !== "undefined") data.discapacidad = mapDiscapacidad(body.discapacidad) as any;

  // =========================
  // Strings (campos simples)
  // =========================
  const strMap: Array<[keyof Prisma.BeneficiarioUpdateInput, any]> = [
    ["telefono", body.telefono],
    ["celular", body.celular],
    ["email", body.email],

    ["direccion", body.direccion],
    ["barrio", body.barrio],
    ["ciudad", body.ciudad],
    ["departamento", body.departamento ?? body.dpto],

    ["eps", body.eps],
    ["alergias", body.alergias],
    ["medicamentos", body.medicamentos],
    ["antecedentes", body.antecedentes],

    ["comunidad", body.comunidad],
    ["lengua", body.lengua],
    ["practicasCulturales", body.practicas ?? body.practicasCulturales],

    ["urgenciaNombre", body.urg_nombre ?? body.urgenciaNombre],
    ["urgenciaParentesco", body.urg_parentesco ?? body.urgenciaParentesco],
    ["urgenciaTelefono", body.urg_tel ?? body.urgenciaTelefono],
    ["urgenciaDireccion", body.urg_dir ?? body.urgenciaDireccion],

    ["discapacidadDetalle", body.discapacidadDetalle],
  ];

  for (const [k, v] of strMap) {
    if (typeof v !== "undefined") (data as any)[k] = cleanString(v);
  }

  // =========================
  // JSON flex
  // =========================
  if (typeof body.acudientes !== "undefined") data.acudientes = body.acudientes as Prisma.InputJsonValue;
  if (typeof body.docs !== "undefined") data.docs = body.docs as Prisma.InputJsonValue;

  return data;
}

/* ===================== GET ===================== */
export async function GET(_req: NextRequest, ctx: { params: any }) {
  const id = await getIdParam(ctx);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const item = await prisma.beneficiario.findUnique({ where: { id } });

  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(toUi(item), { headers: { "cache-control": "no-store" } });
}

/* ===================== PATCH ===================== */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getIdParam(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();
    const data = mapPayloadUpdate(body);

    const up = await prisma.beneficiario.update({ where: { id }, data });

    return NextResponse.json(toUi(up), { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Beneficiario no encontrado." }, { status: 404 });
    }
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Documento duplicado (doc ya existe)." }, { status: 409 });
    }
    console.error("PATCH /api/beneficiarios/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/* ===================== DELETE ===================== */
export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getIdParam(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.beneficiario.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Beneficiario no encontrado." }, { status: 404 });
    }
    console.error("DELETE /api/beneficiarios/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
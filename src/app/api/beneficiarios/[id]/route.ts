import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, Sexo, Zona, GrupoRH, DiscapacidadTipo, TipoDocumento } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Next 15: params puede venir como Promise */
async function getIdParam(ctx: { params: any }) {
  const p = await ctx.params; // funciona si es objeto o Promise
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) return null;
  return id;
}

const cleanString = (v: any) => {
  if (v === null) return null;
  if (typeof v === "undefined") return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
};

const mapSexo = (s?: string | null): Sexo | null | undefined => {
  if (s === null) return null;
  if (typeof s === "undefined") return undefined;
  const t = String(s).toLowerCase();
  if (!t) return undefined;
  if (t.startsWith("fem")) return Sexo.FEMENINO;
  if (t.startsWith("mas")) return Sexo.MASCULINO;
  return Sexo.OTRO;
};

const mapZona = (z?: string | null): Zona | null | undefined => {
  if (z === null) return null;
  if (typeof z === "undefined") return undefined;
  const t = String(z).toLowerCase();
  if (!t) return undefined;
  return t.startsWith("u") ? Zona.URBANA : Zona.RURAL;
};

const mapRH = (rh?: string | null): GrupoRH | null | undefined => {
  if (rh === null) return null;
  if (typeof rh === "undefined") return undefined;
  const v = String(rh).toUpperCase().replace(/\s+/g, "");
  if (!v) return undefined;

  const map: Record<string, GrupoRH> = {
    "O+": GrupoRH.O_POS, "O-": GrupoRH.O_NEG,
    "A+": GrupoRH.A_POS, "A-": GrupoRH.A_NEG,
    "B+": GrupoRH.B_POS, "B-": GrupoRH.B_NEG,
    "AB+": GrupoRH.AB_POS, "AB-": GrupoRH.AB_NEG,
    // por si llega ya como enum:
    "O_POS": GrupoRH.O_POS, "O_NEG": GrupoRH.O_NEG,
    "A_POS": GrupoRH.A_POS, "A_NEG": GrupoRH.A_NEG,
    "B_POS": GrupoRH.B_POS, "B_NEG": GrupoRH.B_NEG,
    "AB_POS": GrupoRH.AB_POS, "AB_NEG": GrupoRH.AB_NEG,
  };

  return map[v] ?? null;
};

const mapDiscapacidad = (d?: string | null): DiscapacidadTipo | null | undefined => {
  if (d === null) return null;
  if (typeof d === "undefined") return undefined;
  const t = String(d).toLowerCase();
  if (!t) return undefined;

  if (t.includes("ninguna")) return DiscapacidadTipo.NINGUNA;
  if (t.includes("visual")) return DiscapacidadTipo.VISUAL;
  if (t.includes("audit")) return DiscapacidadTipo.AUDITIVA;
  if (t.includes("motor")) return DiscapacidadTipo.MOTORA;
  if (t.includes("cogn")) return DiscapacidadTipo.COGNITIVA;
  return DiscapacidadTipo.OTRA;
};

const coerceDate = (s?: string | null) => {
  if (s === null) return null;
  if (typeof s === "undefined") return undefined;
  const t = String(s).trim();
  if (!t) return undefined;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** PATCH: acepta payload UI o payload “modelo”, sin defaults */
function mapPayloadUpdate(body: any): Prisma.BeneficiarioUpdateInput {
  const data: Prisma.BeneficiarioUpdateInput = {};

  // doc/tipoDoc (solo si vienen explícitos)
  if (typeof body.tipoDoc !== "undefined" || typeof body.tipo_doc !== "undefined") {
    data.tipoDoc = (body.tipoDoc ?? body.tipo_doc) as TipoDocumento;
  }
  if (typeof body.doc !== "undefined" || typeof body.num_doc !== "undefined") {
    data.doc = cleanString(body.doc ?? body.num_doc) as any;
  }

  if (typeof body.nombres !== "undefined") data.nombres = cleanString(body.nombres) as any;
  if (typeof body.apellidos !== "undefined") data.apellidos = cleanString(body.apellidos) as any;

  if (typeof body.fechaNacimiento !== "undefined" || typeof body.fecha_nac !== "undefined") {
    data.fechaNacimiento = coerceDate(body.fechaNacimiento ?? body.fecha_nac) as any;
  }

  if (typeof body.sexo !== "undefined") data.sexo = mapSexo(body.sexo) as any;

  // contacto/ubicación/etc
  const strMap: Array<[keyof Prisma.BeneficiarioUpdateInput, any]> = [
    ["telefono", body.telefono],
    ["celular", body.celular],
    ["email", body.email],

    ["direccion", body.direccion],
    ["barrio", body.barrio],
    ["ciudad", body.ciudad],
    ["departamento", body.departamento ?? body.dpto],
  ];

  for (const [k, v] of strMap) {
    if (typeof v !== "undefined") (data as any)[k] = cleanString(v);
  }

  if (typeof body.zona !== "undefined") data.zona = mapZona(body.zona) as any;

  if (typeof body.eps !== "undefined") data.eps = cleanString(body.eps) as any;
  if (typeof body.rh !== "undefined") data.rh = mapRH(body.rh) as any;
  if (typeof body.discapacidad !== "undefined") data.discapacidad = mapDiscapacidad(body.discapacidad) as any;
  if (typeof body.discapacidadDetalle !== "undefined") data.discapacidadDetalle = cleanString(body.discapacidadDetalle) as any;

  if (typeof body.alergias !== "undefined") data.alergias = cleanString(body.alergias) as any;
  if (typeof body.medicamentos !== "undefined") data.medicamentos = cleanString(body.medicamentos) as any;
  if (typeof body.antecedentes !== "undefined") data.antecedentes = cleanString(body.antecedentes) as any;

  if (typeof body.comunidad !== "undefined") data.comunidad = cleanString(body.comunidad) as any;
  if (typeof body.lengua !== "undefined") data.lengua = cleanString(body.lengua) as any;
  if (typeof body.practicas !== "undefined" || typeof body.practicasCulturales !== "undefined") {
    data.practicasCulturales = cleanString(body.practicas ?? body.practicasCulturales) as any;
  }

  if (typeof body.urg_nombre !== "undefined" || typeof body.urgenciaNombre !== "undefined") {
    data.urgenciaNombre = cleanString(body.urg_nombre ?? body.urgenciaNombre) as any;
  }
  if (typeof body.urg_parentesco !== "undefined" || typeof body.urgenciaParentesco !== "undefined") {
    data.urgenciaParentesco = cleanString(body.urg_parentesco ?? body.urgenciaParentesco) as any;
  }
  if (typeof body.urg_tel !== "undefined" || typeof body.urgenciaTelefono !== "undefined") {
    data.urgenciaTelefono = cleanString(body.urg_tel ?? body.urgenciaTelefono) as any;
  }
  if (typeof body.urg_dir !== "undefined" || typeof body.urgenciaDireccion !== "undefined") {
    data.urgenciaDireccion = cleanString(body.urg_dir ?? body.urgenciaDireccion) as any;
  }

  // JSON flex
  if (typeof body.acudientes !== "undefined") data.acudientes = body.acudientes as Prisma.InputJsonValue;
  if (typeof body.docs !== "undefined") data.docs = body.docs as Prisma.InputJsonValue;

  return data;
}

/* ===================== GET ===================== */
export async function GET(_req: Request, ctx: { params: any }) {
  const id = await getIdParam(ctx);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const item = await prisma.beneficiario.findUnique({ where: { id } });

  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: "No encontrado" }, { status: 404 });
}

/* ===================== PATCH ===================== */
export async function PATCH(req: Request, ctx: { params: any }) {
  try {
    const id = await getIdParam(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();
    const data = mapPayloadUpdate(body);

    const up = await prisma.beneficiario.update({ where: { id }, data });
    return NextResponse.json(up);
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Beneficiario no encontrado." }, { status: 404 });
    }
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Documento duplicado (doc ya existe)." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/* ===================== DELETE ===================== */
export async function DELETE(_req: Request, ctx: { params: any }) {
  try {
    const id = await getIdParam(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.beneficiario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Beneficiario no encontrado." }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
// src/app/api/beneficiarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, TipoDocumento, Sexo, Zona, GrupoRH, DiscapacidadTipo } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= Helpers ================= */
function clean(v: any) {
  return String(v ?? "").trim();
}

function normKey(v: any) {
  return clean(v)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanUpper(v: any) {
  const t = clean(v);
  return t ? t.toUpperCase() : "";
}

function cleanUpperOpt(v: any) {
  if (v === null) return null;
  if (typeof v === "undefined") return undefined;
  const t = clean(v);
  return t ? t.toUpperCase() : undefined;
}

function cleanOpt(v: any) {
  if (v === null) return null;
  if (typeof v === "undefined") return undefined;
  const t = clean(v);
  return t ? t : undefined;
}

function lowerEmailOpt(v: any) {
  if (v === null) return null;
  if (typeof v === "undefined") return undefined;
  const t = clean(v).toLowerCase();
  return t ? t : undefined;
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

function deepTrimStrings(val: any): any {
  if (val === null || typeof val === "undefined") return val;
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val)) return val.map(deepTrimStrings);
  if (typeof val === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(val)) out[k] = deepTrimStrings(v);
    return out;
  }
  return val;
}

const mapSexo = (s?: any): Sexo | null | undefined => {
  if (s === null) return null;
  if (typeof s === "undefined") return undefined;
  const k = normKey(s);
  if (!k) return undefined;
  if (k.startsWith("FEM")) return Sexo.FEMENINO;
  if (k.startsWith("MAS")) return Sexo.MASCULINO;
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

const coerceDate = (s?: any): Date | null | undefined => {
  if (s === null) return null;
  if (typeof s === "undefined") return undefined;
  const t = clean(s);
  if (!t) return undefined;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const toIntId = (v: any): number | null => {
  if (v === null || typeof v === "undefined") return null;
  const n = typeof v === "number" ? v : Number(clean(v));
  return Number.isFinite(n) ? n : null;
};

function tipoDocFrom(body: any): TipoDocumento {
  const raw = clean(body.tipoDoc ?? body.tipo_doc ?? "CC");
  // si te llega algo raro, cae a CC
  const all = Object.values(TipoDocumento) as string[];
  return (all.includes(raw) ? raw : "CC") as TipoDocumento;
}

/** Lee nombres separados (camel/snake). Si no vienen, usa nombres/apellidos y los parte */
function readSplitNames(body: any) {
  const pn = clean(body.primerNombre ?? body.primer_nombre);
  const sn = clean(body.segundoNombre ?? body.segundo_nombre);
  const pa = clean(body.primerApellido ?? body.primer_apellido);
  const sa = clean(body.segundoApellido ?? body.segundo_apellido);

  const touchedSplit =
    "primerNombre" in body ||
    "primer_nombre" in body ||
    "segundoNombre" in body ||
    "segundo_nombre" in body ||
    "primerApellido" in body ||
    "primer_apellido" in body ||
    "segundoApellido" in body ||
    "segundo_apellido" in body;

  if (touchedSplit) {
    return {
      primerNombre: pn,
      segundoNombre: sn,
      primerApellido: pa,
      segundoApellido: sa,
      nombres: joinParts(pn, sn),
      apellidos: joinParts(pa, sa),
      touchedSplit: true,
    };
  }

  // compat con payload viejo
  const nombresIn = clean(body.nombres ?? "");
  const apellidosIn = clean(body.apellidos ?? "");
  const n = split2(nombresIn);
  const a = split2(apellidosIn);

  return {
    primerNombre: n.a,
    segundoNombre: n.b,
    primerApellido: a.a,
    segundoApellido: a.b,
    nombres: nombresIn,
    apellidos: apellidosIn,
    touchedSplit: false,
  };
}

/* ================= Payload mappers ================= */

/** CREATE: exige mínimos */
function mapPayloadCreate(body: any): Prisma.BeneficiarioCreateInput & Record<string, any> {
  const tipoDoc = tipoDocFrom(body);

  const docRaw = clean(body.doc ?? body.num_doc);
  const doc = docRaw ? docRaw.toUpperCase() : "";

  const split = readSplitNames(body);

  // ✅ si no mandaron nombres/apellidos pero sí split, construimos compat
  const nombresFinal = clean(split.nombres) || joinParts(split.primerNombre, split.segundoNombre);
  const apellidosFinal = clean(split.apellidos) || joinParts(split.primerApellido, split.segundoApellido);

  const data: Prisma.BeneficiarioCreateInput & Record<string, any> = {
    tipoDoc,
    doc,

    // compat (si los conservas en schema)
    nombres: cleanUpper(nombresFinal),
    apellidos: cleanUpper(apellidosFinal),

    // ✅ nuevos (si ya los agregaste al schema)
    primerNombre: cleanUpper(split.primerNombre),
    segundoNombre: split.segundoNombre ? cleanUpper(split.segundoNombre) : null,
    primerApellido: cleanUpper(split.primerApellido),
    segundoApellido: split.segundoApellido ? cleanUpper(split.segundoApellido) : null,

    fechaNacimiento: coerceDate(body.fechaNacimiento ?? body.fecha_nac) ?? undefined,
    sexo: mapSexo(body.sexo) ?? undefined,

    telefono: cleanOpt(body.telefono) as any,
    celular: cleanOpt(body.celular) as any,
    email: lowerEmailOpt(body.email) as any,

    direccion: cleanOpt(body.direccion) as any,
    barrio: cleanOpt(body.barrio) as any,
    ciudad: cleanOpt(body.ciudad) as any,
    departamento: cleanOpt(body.departamento ?? body.dpto) as any,
    zona: mapZona(body.zona) ?? undefined,

    eps: cleanUpperOpt(body.eps) as any,
    rh: mapRH(body.rh) ?? undefined,
    discapacidad: mapDiscapacidad(body.discapacidad) ?? undefined,
    discapacidadDetalle: cleanOpt(body.discapacidadDetalle) as any,
    alergias: cleanOpt(body.alergias) as any,
    medicamentos: cleanOpt(body.medicamentos) as any,
    antecedentes: cleanOpt(body.antecedentes) as any,

    comunidad: cleanOpt(body.comunidad) as any,
    lengua: cleanOpt(body.lengua) as any,
    practicasCulturales: cleanOpt(body.practicas ?? body.practicasCulturales) as any,

    urgenciaNombre: cleanOpt(body.urg_nombre ?? body.urgenciaNombre) as any,
    urgenciaParentesco: cleanOpt(body.urg_parentesco ?? body.urgenciaParentesco) as any,
    urgenciaTelefono: cleanOpt(body.urg_tel ?? body.urgenciaTelefono) as any,
    urgenciaDireccion: cleanOpt(body.urg_dir ?? body.urgenciaDireccion) as any,

    acudientes:
      typeof body.acudientes !== "undefined"
        ? (deepTrimStrings(body.acudientes) as Prisma.InputJsonValue)
        : undefined,

    docs:
      typeof body.docs !== "undefined"
        ? (deepTrimStrings(body.docs) as Prisma.InputJsonValue)
        : typeof body.docsMeta !== "undefined"
        ? (deepTrimStrings(body.docsMeta) as Prisma.InputJsonValue)
        : undefined,
  };

  return data;
}

/** UPDATE: solo actualiza lo que venga */
function mapPayloadUpdate(body: any): Prisma.BeneficiarioUpdateInput & Record<string, any> {
  const data: Prisma.BeneficiarioUpdateInput & Record<string, any> = {};

  // tipo/doc
  if ("tipoDoc" in body || "tipo_doc" in body) {
    data.tipoDoc = tipoDocFrom(body);
  }

  if ("doc" in body || "num_doc" in body) {
    const d = cleanOpt(body.doc ?? body.num_doc);
    if (typeof d === "string") data.doc = d.toUpperCase() as any;
    if (d === null) data.doc = null as any;
  }

  // ✅ nombres separados / compat
  const splitTouched =
    "primerNombre" in body ||
    "primer_nombre" in body ||
    "segundoNombre" in body ||
    "segundo_nombre" in body ||
    "primerApellido" in body ||
    "primer_apellido" in body ||
    "segundoApellido" in body ||
    "segundo_apellido" in body;

  if (splitTouched) {
    const pn = cleanOpt(body.primerNombre ?? body.primer_nombre);
    const sn = cleanOpt(body.segundoNombre ?? body.segundo_nombre);
    const pa = cleanOpt(body.primerApellido ?? body.primer_apellido);
    const sa = cleanOpt(body.segundoApellido ?? body.segundo_apellido);

    if (typeof pn !== "undefined") data.primerNombre = pn ? pn.toUpperCase() : null;
    if (typeof sn !== "undefined") data.segundoNombre = sn ? sn.toUpperCase() : null;
    if (typeof pa !== "undefined") data.primerApellido = pa ? pa.toUpperCase() : null;
    if (typeof sa !== "undefined") data.segundoApellido = sa ? sa.toUpperCase() : null;

    // opcional: también mantener compat
    if ("nombres" in body) data.nombres = cleanUpperOpt(body.nombres) as any;
    if ("apellidos" in body) data.apellidos = cleanUpperOpt(body.apellidos) as any;
  } else {
    // si vienen nombres/apellidos, los partimos
    if ("nombres" in body) {
      const v = cleanOpt(body.nombres);
      if (typeof v !== "undefined") {
        const { a, b } = split2(v);
        data.primerNombre = a ? a.toUpperCase() : null;
        data.segundoNombre = b ? b.toUpperCase() : null;
        data.nombres = v ? v.toUpperCase() : null;
      }
    }
    if ("apellidos" in body) {
      const v = cleanOpt(body.apellidos);
      if (typeof v !== "undefined") {
        const { a, b } = split2(v);
        data.primerApellido = a ? a.toUpperCase() : null;
        data.segundoApellido = b ? b.toUpperCase() : null;
        data.apellidos = v ? v.toUpperCase() : null;
      }
    }
  }

  // fecha/enums
  if ("fechaNacimiento" in body || "fecha_nac" in body) {
    data.fechaNacimiento = coerceDate(body.fechaNacimiento ?? body.fecha_nac) as any;
  }
  if ("sexo" in body) data.sexo = mapSexo(body.sexo) as any;
  if ("zona" in body) data.zona = mapZona(body.zona) as any;
  if ("rh" in body) data.rh = mapRH(body.rh) as any;
  if ("discapacidad" in body) data.discapacidad = mapDiscapacidad(body.discapacidad) as any;

  // strings
  const stringFields: Array<[keyof Prisma.BeneficiarioUpdateInput, any, "upper" | "plain" | "email"]> = [
    ["telefono", body.telefono, "plain"],
    ["celular", body.celular, "plain"],
    ["email", body.email, "email"],

    ["direccion", body.direccion, "plain"],
    ["barrio", body.barrio, "plain"],
    ["ciudad", body.ciudad, "plain"],
    ["departamento", body.departamento ?? body.dpto, "plain"],

    ["eps", body.eps, "upper"],
    ["discapacidadDetalle", body.discapacidadDetalle, "plain"],
    ["alergias", body.alergias, "plain"],
    ["medicamentos", body.medicamentos, "plain"],
    ["antecedentes", body.antecedentes, "plain"],

    ["comunidad", body.comunidad, "plain"],
    ["lengua", body.lengua, "plain"],
    ["practicasCulturales", body.practicas ?? body.practicasCulturales, "plain"],

    ["urgenciaNombre", body.urg_nombre ?? body.urgenciaNombre, "plain"],
    ["urgenciaParentesco", body.urg_parentesco ?? body.urgenciaParentesco, "plain"],
    ["urgenciaTelefono", body.urg_tel ?? body.urgenciaTelefono, "plain"],
    ["urgenciaDireccion", body.urg_dir ?? body.urgenciaDireccion, "plain"],
  ];

  for (const [k, v, mode] of stringFields) {
    if (typeof v === "undefined") continue;
    if (mode === "email") (data as any)[k] = lowerEmailOpt(v);
    else if (mode === "upper") (data as any)[k] = cleanUpperOpt(v);
    else (data as any)[k] = cleanOpt(v);
  }

  // JSON
  if ("acudientes" in body) data.acudientes = deepTrimStrings(body.acudientes) as Prisma.InputJsonValue;
  if ("docs" in body) data.docs = deepTrimStrings(body.docs) as Prisma.InputJsonValue;
  if ("docsMeta" in body && !("docs" in body)) {
    data.docs = deepTrimStrings(body.docsMeta) as Prisma.InputJsonValue;
  }

  return data;
}

/* ================= GET (lista) ================= */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = clean(searchParams.get("q"));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? 50)));
  const skip = (page - 1) * pageSize;

  // compat take/skip antiguos
  const takeRaw = Number(searchParams.get("take"));
  const skipRaw = Number(searchParams.get("skip"));
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 200) : pageSize;
  const skip2 = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : skip;

  const where: Prisma.BeneficiarioWhereInput = q
    ? {
        OR: [
          { doc: { contains: q, mode: "insensitive" } },

          // compat (campos antiguos)
          { nombres: { contains: q, mode: "insensitive" } },
          { apellidos: { contains: q, mode: "insensitive" } },

          // ✅ nuevos
          { primerNombre: { contains: q, mode: "insensitive" } },
          { segundoNombre: { contains: q, mode: "insensitive" } },
          { primerApellido: { contains: q, mode: "insensitive" } },
          { segundoApellido: { contains: q, mode: "insensitive" } },

          { ciudad: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.beneficiario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip: skip2,
    }),
    prisma.beneficiario.count({ where }),
  ]);

  return NextResponse.json(
    { items, total, page, pageSize },
    { headers: { "cache-control": "no-store" } }
  );
}

/* ================= POST (crear) ================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // blindaje: ignora cosas que no deben venir en CREATE
    if (body && typeof body === "object") {
      delete body.id;
      delete body.createdAt;
      delete body.updatedAt;
    }

    if (!body?.doc && !body?.num_doc) {
      return NextResponse.json({ error: "doc/num_doc es requerido" }, { status: 400 });
    }

    const data = mapPayloadCreate(body);

    if (!data.doc || !String(data.doc).trim()) {
      return NextResponse.json({ error: "El documento no puede estar vacío." }, { status: 400 });
    }
    // mínimo: primer nombre y primer apellido
    if (!data.primerNombre || !data.primerApellido) {
      return NextResponse.json(
        { error: "Faltan nombres: primerNombre/primerApellido (o envía nombres/apellidos)." },
        { status: 400 }
      );
    }

    const created = await prisma.beneficiario.create({ data });
    return NextResponse.json(created, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un beneficiario con ese documento." }, { status: 409 });
    }
    console.error("POST /api/beneficiarios error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/* ================= PUT (actualizar por id o doc) ================= */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const id = toIntId(body.id);
    const docWhereRaw = body.doc ?? body.num_doc;
    const docWhere = docWhereRaw ? clean(docWhereRaw).toUpperCase() : "";

    if (!id && !docWhere) {
      return NextResponse.json(
        { error: 'Para actualizar envía "id" (number) o "doc/num_doc".' },
        { status: 400 }
      );
    }

    const data = mapPayloadUpdate(body);

    // soporte doc nuevo
    if (id && (body.docNuevo || body.num_doc_nuevo)) {
      const newDoc = clean(body.docNuevo ?? body.num_doc_nuevo).toUpperCase();
      if (newDoc) data.doc = newDoc as any;
    }

    const updated = await prisma.beneficiario.update({
      where: id ? { id } : { doc: docWhere },
      data,
      select: {
        id: true,
        tipoDoc: true,
        doc: true,

        // compat + nuevos
        nombres: true,
        apellidos: true,
        primerNombre: true,
        segundoNombre: true,
        primerApellido: true,
        segundoApellido: true,

        email: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated, { status: 200, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Beneficiario no encontrado." }, { status: 404 });
    }
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe otro beneficiario con ese número de documento." },
        { status: 409 }
      );
    }
    console.error("PUT /api/beneficiarios error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
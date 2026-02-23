import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TipoDocumento, Sexo, Zona, GrupoRH, DiscapacidadTipo, Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ==== helpers de mapeo desde la UI ==== */
const mapSexo = (s?: string | null): Sexo | null | undefined => {
  if (s === null) return null;
  if (!s) return undefined;
  const t = s.toLowerCase();
  if (t.startsWith("fem")) return Sexo.FEMENINO;
  if (t.startsWith("mas")) return Sexo.MASCULINO;
  return Sexo.OTRO;
};

const mapZona = (z?: string | null): Zona | null | undefined => {
  if (z === null) return null;
  if (!z) return undefined;
  return z.toLowerCase().startsWith("u") ? Zona.URBANA : Zona.RURAL;
};

const mapRH = (rh?: string | null): GrupoRH | null | undefined => {
  if (rh === null) return null;
  if (!rh) return undefined;
  const v = rh.toUpperCase().replace(/\s+/g, "");
  const map: Record<string, GrupoRH> = {
    "O+": GrupoRH.O_POS,
    "O-": GrupoRH.O_NEG,
    "A+": GrupoRH.A_POS,
    "A-": GrupoRH.A_NEG,
    "B+": GrupoRH.B_POS,
    "B-": GrupoRH.B_NEG,
    "AB+": GrupoRH.AB_POS,
    "AB-": GrupoRH.AB_NEG,

    // por si llega como enum:
    O_POS: GrupoRH.O_POS,
    O_NEG: GrupoRH.O_NEG,
    A_POS: GrupoRH.A_POS,
    A_NEG: GrupoRH.A_NEG,
    B_POS: GrupoRH.B_POS,
    B_NEG: GrupoRH.B_NEG,
    AB_POS: GrupoRH.AB_POS,
    AB_NEG: GrupoRH.AB_NEG,
  };
  return map[v] ?? null;
};

const mapDiscapacidad = (d?: string | null): DiscapacidadTipo | null | undefined => {
  if (d === null) return null;
  if (!d) return undefined;
  const t = d.toLowerCase();
  if (t.includes("visual")) return DiscapacidadTipo.VISUAL;
  if (t.includes("audit")) return DiscapacidadTipo.AUDITIVA;
  if (t.includes("motor")) return DiscapacidadTipo.MOTORA;
  if (t.includes("cogn")) return DiscapacidadTipo.COGNITIVA;
  if (t.includes("ninguna") || t === "") return DiscapacidadTipo.NINGUNA;
  return DiscapacidadTipo.OTRA;
};

const coerceDate = (s?: string | null): Date | null | undefined => {
  if (s === null) return null;
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const toIntId = (v: any): number | null => {
  if (v === null || typeof v === "undefined") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

const cleanString = (v: any) => {
  if (v === null) return null;
  if (typeof v === "undefined") return undefined;
  if (typeof v !== "string") return v;

  const t = v.trim();
  return t === "" ? undefined : t.toUpperCase();
};

const upperJsonStrings = (val: any): any => {
  if (val === null || typeof val === "undefined") return val;
  if (typeof val === "string") return val.trim().toUpperCase();
  if (Array.isArray(val)) return val.map(upperJsonStrings);
  if (typeof val === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(val)) out[k] = upperJsonStrings(v);
    return out;
  }
  return val;
};

/** CREATE: exige mínimos y permite defaults */
function mapPayloadCreate(body: any): Prisma.BeneficiarioCreateInput {
  const tipoDoc = (body.tipoDoc || body.tipo_doc || "CC") as TipoDocumento;
  const doc = String(body.doc ?? body.num_doc ?? "").trim();

  const data: Prisma.BeneficiarioCreateInput = {
    tipoDoc,
    doc,
    nombres: String(body.nombres ?? "").trim().toUpperCase(),
    apellidos: String(body.apellidos ?? "").trim().toUpperCase(),

    fechaNacimiento: coerceDate(body.fechaNacimiento ?? body.fecha_nac) ?? undefined,
    sexo: mapSexo(body.sexo) ?? undefined,

    telefono: cleanString(body.telefono) as any,
    celular: cleanString(body.celular) as any,
    email: cleanString(body.email) as any,

    direccion: cleanString(body.direccion) as any,
    barrio: cleanString(body.barrio) as any,
    ciudad: cleanString(body.ciudad) as any,
    departamento: cleanString(body.departamento ?? body.dpto) as any,
    zona: mapZona(body.zona) ?? undefined,

    eps: cleanString(body.eps).trim().toUpperCase() as any,
    rh: mapRH(body.rh) ?? undefined,
    discapacidad: mapDiscapacidad(body.discapacidad) ?? undefined,
    discapacidadDetalle: cleanString(body.discapacidadDetalle) as any,
    alergias: cleanString(body.alergias) as any,
    medicamentos: cleanString(body.medicamentos) as any,
    antecedentes: cleanString(body.antecedentes) as any,

    comunidad: cleanString(body.comunidad) as any,
    lengua: cleanString(body.lengua) as any,
    practicasCulturales: cleanString(body.practicas ?? body.practicasCulturales) as any,

    urgenciaNombre: cleanString(body.urg_nombre ?? body.urgenciaNombre) as any,
    urgenciaParentesco: cleanString(body.urg_parentesco ?? body.urgenciaParentesco) as any,
    urgenciaTelefono: cleanString(body.urg_tel ?? body.urgenciaTelefono) as any,
    urgenciaDireccion: cleanString(body.urg_dir ?? body.urgenciaDireccion) as any,

    acudientes: body.acudientes
      ? (upperJsonStrings(body.acudientes) as Prisma.InputJsonValue)
      : undefined,

    docs: body.docs
      ? (upperJsonStrings(body.docs) as Prisma.InputJsonValue)
      : (body.docsMeta ? (upperJsonStrings(body.docsMeta) as Prisma.InputJsonValue) : undefined),
  };

  return data;
}

/** UPDATE: SOLO actualiza lo que venga (sin defaults) */
function mapPayloadUpdate(body: any): Prisma.BeneficiarioUpdateInput {
  const data: Prisma.BeneficiarioUpdateInput = {};

  if (typeof body.tipoDoc !== "undefined" || typeof body.tipo_doc !== "undefined") {
    data.tipoDoc = (body.tipoDoc ?? body.tipo_doc) as TipoDocumento;
  }
  if (typeof body.nombres !== "undefined") data.nombres = cleanString(body.nombres) as any;
  if (typeof body.apellidos !== "undefined") data.apellidos = cleanString(body.apellidos) as any;

  if (typeof body.fechaNacimiento !== "undefined" || typeof body.fecha_nac !== "undefined") {
    data.fechaNacimiento = coerceDate(body.fechaNacimiento ?? body.fecha_nac) as any;
  }
  if (typeof body.sexo !== "undefined") data.sexo = mapSexo(body.sexo) as any;
  if (typeof body.zona !== "undefined") data.zona = mapZona(body.zona) as any;
  if (typeof body.rh !== "undefined") data.rh = mapRH(body.rh) as any;
  if (typeof body.discapacidad !== "undefined") data.discapacidad = mapDiscapacidad(body.discapacidad) as any;

  const stringFields: Array<[string, any]> = [
    ["telefono", body.telefono],
    ["celular", body.celular],
    ["email", body.email],
    ["direccion", body.direccion],
    ["barrio", body.barrio],
    ["ciudad", body.ciudad],
    ["departamento", body.departamento ?? body.dpto],
    ["eps", body.eps],
    ["discapacidadDetalle", body.discapacidadDetalle],
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
  ];

  for (const [k, v] of stringFields) {
    if (typeof v !== "undefined") (data as any)[k] = cleanString(v);
  }

  if (typeof body.acudientes !== "undefined")
    data.acudientes = upperJsonStrings(body.acudientes) as Prisma.InputJsonValue;

  if (typeof body.docs !== "undefined")
    data.docs = upperJsonStrings(body.docs) as Prisma.InputJsonValue;

  if (typeof body.docsMeta !== "undefined" && typeof body.docs === "undefined") {
    data.docs = upperJsonStrings(body.docsMeta) as Prisma.InputJsonValue;
  }
  return data;
}

/* ==== GET: lista con filtros básicos ==== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const takeRaw = Number(searchParams.get("take") ?? 50);
  const skipRaw = Number(searchParams.get("skip") ?? 0);
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 200) : 50;
  const skip = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : 0;

  const where: Prisma.BeneficiarioWhereInput = q
    ? {
        OR: [
          { doc: { contains: q, mode: "insensitive" } },
          { nombres: { contains: q, mode: "insensitive" } },
          { apellidos: { contains: q, mode: "insensitive" } },
          { ciudad: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.beneficiario.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    prisma.beneficiario.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

/* ==== POST: crear beneficiario ==== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ blindaje: aunque llegue id/createdAt/updatedAt desde el front, se ignoran en CREATE
    if (body && typeof body === "object") {
      delete body.id;
      delete body.createdAt;
      delete body.updatedAt;
    }

    if (!body?.doc && !body?.num_doc) {
      return NextResponse.json({ error: "doc/num_doc es requerido" }, { status: 400 });
    }

    const data = mapPayloadCreate(body);

    if (!data.doc || String(data.doc).trim() === "") {
      return NextResponse.json({ error: "El documento no puede estar vacío." }, { status: 400 });
    }

    const created = await prisma.beneficiario.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un beneficiario con ese documento." }, { status: 409 });
    }
    console.error("POST /api/beneficiarios error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/* ==== PUT: actualizar beneficiario (por id INT o por doc) ==== */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id = toIntId(body.id);
    const docWhere = (body.doc ?? body.num_doc) as string | undefined;

    if (!id && !docWhere) {
      return NextResponse.json(
        { error: 'Para actualizar envía "id" (number) o "doc/num_doc".' },
        { status: 400 }
      );
    }

    const data = mapPayloadUpdate(body);

    if (id && (body.docNuevo || body.num_doc_nuevo)) {
      (data as any).doc = String(body.docNuevo ?? body.num_doc_nuevo).trim();
    }

    const updated = await prisma.beneficiario.update({
      where: id ? { id } : { doc: String(docWhere) },
      data,
      select: {
        id: true,
        tipoDoc: true,
        doc: true,
        nombres: true,
        apellidos: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
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
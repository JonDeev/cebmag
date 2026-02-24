import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // ✅ necesario para Prisma.sql / join

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =================== Mapas UI <-> Prisma =================== */
const tipoToDb: Record<string, "ADMINISTRATIVO" | "ASISTENCIAL"> = {
  Administrativo: "ADMINISTRATIVO",
  Asistencial: "ASISTENCIAL",
  ADMINISTRATIVO: "ADMINISTRATIVO",
  ASISTENCIAL: "ASISTENCIAL",
};

const estadoToDb: Record<
  string,
  "EN_EVALUACION" | "APROBADA" | "RECHAZADA" | "CONTRATO_GENERADO" | "FIRMADO"
> = {
  "En evaluación": "EN_EVALUACION",
  Aprobada: "APROBADA",
  Rechazada: "RECHAZADA",
  "Contrato generado": "CONTRATO_GENERADO",
  Firmado: "FIRMADO",
  EN_EVALUACION: "EN_EVALUACION",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
  CONTRATO_GENERADO: "CONTRATO_GENERADO",
  FIRMADO: "FIRMADO",
};

const modalidadToDb: Record<string, "PRESTACION_SERVICIOS" | "TEMPORAL" | "INDEFINIDO"> = {
  "Prestación de servicios": "PRESTACION_SERVICIOS",
  Temporal: "TEMPORAL",
  Indefinido: "INDEFINIDO",
  PRESTACION_SERVICIOS: "PRESTACION_SERVICIOS",
  TEMPORAL: "TEMPORAL",
  INDEFINIDO: "INDEFINIDO",
};

const jornadaToDb: Record<string, "TIEMPO_COMPLETO" | "MEDIO_TIEMPO" | "POR_HORAS"> = {
  "Tiempo completo": "TIEMPO_COMPLETO",
  "Medio tiempo": "MEDIO_TIEMPO",
  "Por horas": "POR_HORAS",
  TIEMPO_COMPLETO: "TIEMPO_COMPLETO",
  MEDIO_TIEMPO: "MEDIO_TIEMPO",
  POR_HORAS: "POR_HORAS",
};

const salarioTipoToDb: Record<string, "SALARIO" | "HONORARIOS"> = {
  Salario: "SALARIO",
  Honorarios: "HONORARIOS",
  SALARIO: "SALARIO",
  HONORARIOS: "HONORARIOS",
};

const periodoToDb: Record<string, "MENSUAL" | "QUINCENAL" | "POR_SERVICIO"> = {
  Mensual: "MENSUAL",
  Quincenal: "QUINCENAL",
  "Por servicio": "POR_SERVICIO",
  MENSUAL: "MENSUAL",
  QUINCENAL: "QUINCENAL",
  POR_SERVICIO: "POR_SERVICIO",
};

/* =================== Mapas DB -> UI =================== */
const tipoToUi: Record<string, "Administrativo" | "Asistencial"> = {
  ADMINISTRATIVO: "Administrativo",
  ASISTENCIAL: "Asistencial",
};

const estadoToUi: Record<
  string,
  "En evaluación" | "Aprobada" | "Rechazada" | "Contrato generado" | "Firmado"
> = {
  EN_EVALUACION: "En evaluación",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CONTRATO_GENERADO: "Contrato generado",
  FIRMADO: "Firmado",
};

const modalidadToUi: Record<string, "Prestación de servicios" | "Temporal" | "Indefinido"> = {
  PRESTACION_SERVICIOS: "Prestación de servicios",
  TEMPORAL: "Temporal",
  INDEFINIDO: "Indefinido",
};

const jornadaToUi: Record<string, "Tiempo completo" | "Medio tiempo" | "Por horas"> = {
  TIEMPO_COMPLETO: "Tiempo completo",
  MEDIO_TIEMPO: "Medio tiempo",
  POR_HORAS: "Por horas",
};

const salarioTipoToUi: Record<string, "Salario" | "Honorarios"> = {
  SALARIO: "Salario",
  HONORARIOS: "Honorarios",
};

const periodoToUi: Record<string, "Mensual" | "Quincenal" | "Por servicio"> = {
  MENSUAL: "Mensual",
  QUINCENAL: "Quincenal",
  POR_SERVICIO: "Por servicio",
};

/* =================== Helpers =================== */
const toISO = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

const toDateOrNull = (s: any) => {
  if (s === null || typeof s === "undefined" || String(s).trim() === "") return null;
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
};

const asObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const asArr = (v: any) => (Array.isArray(v) ? v : []);

async function nextRadicadoInscripcion() {
  const year = new Date().getFullYear();
  const prefix = `INS-${year}-`;
  const last = await prisma.inscripcion.findFirst({
    where: { radicado: { startsWith: prefix } },
    orderBy: { radicado: "desc" },
    select: { radicado: true },
  });

  const lastNum = last?.radicado?.slice(prefix.length) ?? "0000";
  const n = Number(lastNum);
  const next = Number.isFinite(n) ? n + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function toUi(row: any) {
  return {
    id: row.id,
    radicado: row.radicado,
    fecha: toISO(row.fecha),
    tipo: tipoToUi[row.tipo] ?? "Asistencial",
    candidato: asObj(row.candidato),
    cargo: row.cargo,
    actividad: row.actividad,
    estado: estadoToUi[row.estado] ?? "En evaluación",
    evaluacion: asObj(row.evaluacion),
    contrato: row.contrato
      ? {
          modalidad: modalidadToUi[row.contrato.modalidad] ?? "Prestación de servicios",
          jornada: jornadaToUi[row.contrato.jornada] ?? "Tiempo completo",
          salarioTipo: salarioTipoToUi[row.contrato.salarioTipo] ?? "Salario",
          valor: row.contrato.valor ?? 0,
          periodo: periodoToUi[row.contrato.periodo] ?? "Mensual",
          inicio: toISO(row.contrato.inicio),
          fin: toISO(row.contrato.fin),
          descripcion: row.contrato.descripcion ?? "",
        }
      : undefined,
    adjuntos: asArr(row.adjuntos),
  };
}

/* =================== GET /api/inscripciones (con búsqueda JSON) =================== */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const estado = (searchParams.get("estado") ?? "").trim();
  const tipo = (searchParams.get("tipo") ?? "").trim();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? 50)));
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const estDb = (estadoToDb as any)[estado];
  const tipoDb = (tipoToDb as any)[tipo];

  const filters: Prisma.Sql[] = [];

  if (estDb) filters.push(Prisma.sql`i."estado" = ${estDb}`);
  if (tipoDb) filters.push(Prisma.sql`i."tipo" = ${tipoDb}`);

  if (q) {
    const like = `%${q}%`;
    filters.push(Prisma.sql`
      (
        i."radicado" ILIKE ${like}
        OR i."cargo" ILIKE ${like}
        OR i."actividad" ILIKE ${like}
        OR COALESCE(i."candidato"->>'doc','') ILIKE ${like}
        OR COALESCE(i."candidato"->>'nombres','') ILIKE ${like}
        OR COALESCE(i."candidato"->>'apellidos','') ILIKE ${like}
      )
    `);
  }

  // ✅ AQUÍ está el fix: no envolver join en Prisma.sql`${...}`
  const whereSql: Prisma.Sql =
    filters.length > 0 ? Prisma.join(filters, Prisma.sql` AND `) : Prisma.sql`1=1`;

  // 1) total
  const totalRows = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`SELECT COUNT(*)::bigint AS total FROM "Inscripcion" i WHERE ${whereSql}`
  );
  const total = Number(totalRows?.[0]?.total ?? 0);

  // 2) ids paginados
  const idRows = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT i."id" AS id
      FROM "Inscripcion" i
      WHERE ${whereSql}
      ORDER BY i."fecha" DESC, i."radicado" DESC
      OFFSET ${skip} LIMIT ${take}
    `
  );

  const ids = idRows.map((r) => r.id);

  if (ids.length === 0) {
    return NextResponse.json(
      { total, page, pageSize, items: [] },
      { headers: { "cache-control": "no-store" } }
    );
  }

  // 3) traer registros completos + contrato
  const items = await prisma.inscripcion.findMany({
    where: { id: { in: ids } },
    include: { contrato: true },
  });

  // 4) reordenar como el SQL
  const byId = new Map(items.map((x) => [x.id, x]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as any[];

  return NextResponse.json(
    { total, page, pageSize, items: ordered.map(toUi) },
    { headers: { "cache-control": "no-store" } }
  );
}

/* =================== POST /api/inscripciones =================== */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const radicado = (body?.radicado ?? "").trim() || (await nextRadicadoInscripcion());
    const fecha = toDateOrNull(body?.fecha) ?? new Date();

    const tipoDb = tipoToDb[body?.tipo] ?? "ASISTENCIAL";
    const estadoDb = estadoToDb[body?.estado] ?? "EN_EVALUACION";

    const candidato = asObj(body?.candidato);
    const cargo = String(body?.cargo ?? "").trim();
    const actividad = String(body?.actividad ?? "").trim();

    if (!candidato?.doc || !candidato?.nombres || !candidato?.apellidos || !cargo || !actividad) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: candidato.doc, candidato.nombres, candidato.apellidos, cargo, actividad." },
        { status: 400 }
      );
    }

    const evaluacion = asObj(body?.evaluacion);
    const adjuntos = asArr(body?.adjuntos);

    const contratoUi = body?.contrato ?? null;

    const created = await prisma.inscripcion.create({
      data: {
        radicado,
        fecha,
        tipo: tipoDb as any,
        candidato: candidato as any,
        cargo,
        actividad,
        estado: estadoDb as any,
        evaluacion: evaluacion as any,
        adjuntos: adjuntos as any,

        ...(contratoUi
          ? {
              contrato: {
                create: {
                  modalidad: modalidadToDb[contratoUi.modalidad] ?? "PRESTACION_SERVICIOS",
                  jornada: jornadaToDb[contratoUi.jornada] ?? "TIEMPO_COMPLETO",
                  salarioTipo: salarioTipoToDb[contratoUi.salarioTipo] ?? "SALARIO",
                  valor: Number(contratoUi.valor ?? 0),
                  periodo: periodoToDb[contratoUi.periodo] ?? "MENSUAL",
                  inicio: toDateOrNull(contratoUi.inicio) ?? new Date(),
                  fin: toDateOrNull(contratoUi.fin),
                  descripcion: (contratoUi.descripcion ?? "").toString() || null,
                },
              },
            }
          : {}),
      },
      include: { contrato: true },
    });

    return NextResponse.json(toUi(created), {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (e: any) {
    console.error("POST /api/inscripciones error:", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una inscripción con ese radicado." }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message ?? "Error creando inscripción" }, { status: 500 });
  }
}
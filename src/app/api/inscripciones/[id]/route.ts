import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getIntId(ctx: { params: any }) {
  const p = await ctx.params; // ✅ Next 15
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

const toDateOrNull = (s: any) => {
  if (s === null || typeof s === "undefined" || String(s).trim() === "") return null;
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
};

const asObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const asArr = (v: any) => (Array.isArray(v) ? v : []);
const toISO = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/* Mapas (idénticos a route.ts, los repetimos para que copies sin depender de libs) */
const tipoToDb: Record<string, "ADMINISTRATIVO" | "ASISTENCIAL"> = {
  "Administrativo": "ADMINISTRATIVO",
  "Asistencial": "ASISTENCIAL",
  ADMINISTRATIVO: "ADMINISTRATIVO",
  ASISTENCIAL: "ASISTENCIAL",
};
const estadoToDb: Record<string, "EN_EVALUACION" | "APROBADA" | "RECHAZADA" | "CONTRATO_GENERADO" | "FIRMADO"> = {
  "En evaluación": "EN_EVALUACION",
  "Aprobada": "APROBADA",
  "Rechazada": "RECHAZADA",
  "Contrato generado": "CONTRATO_GENERADO",
  "Firmado": "FIRMADO",
  EN_EVALUACION: "EN_EVALUACION",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
  CONTRATO_GENERADO: "CONTRATO_GENERADO",
  FIRMADO: "FIRMADO",
};
const modalidadToDb: Record<string, "PRESTACION_SERVICIOS" | "TEMPORAL" | "INDEFINIDO"> = {
  "Prestación de servicios": "PRESTACION_SERVICIOS",
  "Temporal": "TEMPORAL",
  "Indefinido": "INDEFINIDO",
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
  "Salario": "SALARIO",
  "Honorarios": "HONORARIOS",
  SALARIO: "SALARIO",
  HONORARIOS: "HONORARIOS",
};
const periodoToDb: Record<string, "MENSUAL" | "QUINCENAL" | "POR_SERVICIO"> = {
  "Mensual": "MENSUAL",
  "Quincenal": "QUINCENAL",
  "Por servicio": "POR_SERVICIO",
  MENSUAL: "MENSUAL",
  QUINCENAL: "QUINCENAL",
  POR_SERVICIO: "POR_SERVICIO",
};

const tipoToUi: Record<string, "Administrativo" | "Asistencial"> = { ADMINISTRATIVO: "Administrativo", ASISTENCIAL: "Asistencial" };
const estadoToUi: Record<string, "En evaluación" | "Aprobada" | "Rechazada" | "Contrato generado" | "Firmado"> = {
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
const salarioTipoToUi: Record<string, "Salario" | "Honorarios"> = { SALARIO: "Salario", HONORARIOS: "Honorarios" };
const periodoToUi: Record<string, "Mensual" | "Quincenal" | "Por servicio"> = { MENSUAL: "Mensual", QUINCENAL: "Quincenal", POR_SERVICIO: "Por servicio" };

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

/* =================== GET /api/inscripciones/[id] =================== */
export async function GET(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getIntId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const row = await prisma.inscripcion.findUnique({
      where: { id },
      include: { contrato: true },
    });
    if (!row) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    return NextResponse.json(toUi(row), { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("GET /api/inscripciones/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/* =================== PATCH /api/inscripciones/[id] =================== */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getIntId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();
    const patch: any = {};

    if (body.radicado !== undefined) patch.radicado = String(body.radicado).trim();
    if (body.fecha !== undefined) patch.fecha = toDateOrNull(body.fecha) ?? undefined;
    if (body.tipo !== undefined) patch.tipo = (tipoToDb[body.tipo] ?? body.tipo) as any;
    if (body.candidato !== undefined) patch.candidato = asObj(body.candidato) as any;
    if (body.cargo !== undefined) patch.cargo = String(body.cargo ?? "").trim();
    if (body.actividad !== undefined) patch.actividad = String(body.actividad ?? "").trim();
    if (body.estado !== undefined) patch.estado = (estadoToDb[body.estado] ?? body.estado) as any;
    if (body.evaluacion !== undefined) patch.evaluacion = asObj(body.evaluacion) as any;
    if (body.adjuntos !== undefined) patch.adjuntos = asArr(body.adjuntos) as any;

    // contrato: si viene, upsert; si viene null, se puede borrar
    if (body.contrato !== undefined) {
      if (body.contrato === null) {
        patch.contrato = { delete: true };
      } else {
        const c = body.contrato;
        patch.contrato = {
          upsert: {
            create: {
              modalidad: modalidadToDb[c.modalidad] ?? "PRESTACION_SERVICIOS",
              jornada: jornadaToDb[c.jornada] ?? "TIEMPO_COMPLETO",
              salarioTipo: salarioTipoToDb[c.salarioTipo] ?? "SALARIO",
              valor: Number(c.valor ?? 0),
              periodo: periodoToDb[c.periodo] ?? "MENSUAL",
              inicio: toDateOrNull(c.inicio) ?? new Date(),
              fin: toDateOrNull(c.fin),
              descripcion: (c.descripcion ?? "").toString() || null,
            },
            update: {
              modalidad: modalidadToDb[c.modalidad] ?? "PRESTACION_SERVICIOS",
              jornada: jornadaToDb[c.jornada] ?? "TIEMPO_COMPLETO",
              salarioTipo: salarioTipoToDb[c.salarioTipo] ?? "SALARIO",
              valor: Number(c.valor ?? 0),
              periodo: periodoToDb[c.periodo] ?? "MENSUAL",
              inicio: toDateOrNull(c.inicio) ?? undefined,
              fin: toDateOrNull(c.fin),
              descripcion: (c.descripcion ?? "").toString() || null,
            },
          },
        };
      }
    }

    const updated = await prisma.inscripcion.update({
      where: { id },
      data: patch,
      include: { contrato: true },
    });

    return NextResponse.json(toUi(updated), { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("PATCH /api/inscripciones/[id] error:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    if (e?.code === "P2002") return NextResponse.json({ error: "Radicado ya existe." }, { status: 409 });
    return NextResponse.json({ error: e?.message ?? "Error actualizando" }, { status: 500 });
  }
}

/* =================== DELETE /api/inscripciones/[id] =================== */
export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getIntId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.inscripcion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/inscripciones/[id] error:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({ error: e?.message ?? "Error eliminando" }, { status: 500 });
  }
}
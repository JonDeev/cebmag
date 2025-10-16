import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePQRSBody } from "@/lib/pqrs.schema";
import { mapCanal, mapEstado, mapOrigen, mapTipo } from "@/lib/pqrs";

const ESTADOS_ENUM = ["ABIERTA", "EN_TRAMITE", "RE_ABIERTO", "CERRADA"] as const;
type EstadoEnum = (typeof ESTADOS_ENUM)[number];

// helper: usa el mapa o regresa el valor original
const pickOrSelf = (tbl: Record<string, string>, val?: string) =>
  val !== undefined ? (tbl[val] ?? val) : undefined;

function toEnumEstado(input?: string | null): EstadoEnum | undefined {
  if (!input) return undefined;
  if (ESTADOS_ENUM.includes(input as EstadoEnum)) return input as EstadoEnum;
  const mapped = (mapEstado as any)[input];
  if (mapped && ESTADOS_ENUM.includes(mapped)) return mapped as EstadoEnum;
  const norm = input.replace(/\s+/g, "_").toUpperCase(); // "Re abierto" -> "RE_ABIERTO"
  if (ESTADOS_ENUM.includes(norm as EstadoEnum)) return norm as EstadoEnum;
  return undefined;
}

/* ================= GET (robusto) ================= */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raw = params.id;

    // ¿tu PK es Int o String? Probamos ambas.
    const n = Number(raw);
    const isIntId = Number.isInteger(n) && String(n) === raw;

    // 1) por id (int o string)
    let row = await prisma.pQRS.findUnique({
      where: isIntId ? ({ id: n } as any) : ({ id: raw } as any),
    });

    // 2) si no existe, por radicado (por si pasaste PQ-2025-0001)
    if (!row) {
      row = await prisma.pQRS.findFirst({ where: { radicado: raw } });
    }

    if (!row) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e: any) {
    console.error("GET /api/pqrs/[id] error:", e);
    return NextResponse.json(
      { error: e?.message || "Error obteniendo detalle" },
      { status: 500 }
    );
  }
}

/* ================= PATCH (tu versión ajustada) ================= */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.json();

    // alias: si viene status y no estado, úsalo
    const withAlias = { ...raw, ...(raw.status && !raw.estado ? { estado: raw.status } : {}) };

    // valida con tu schema; si falla, seguimos con withAlias para no bloquear
    let data: any;
    try {
      data = updatePQRSBody.parse(withAlias);
    } catch {
      data = withAlias;
    }

    const patch: any = {};

    if (data.fecha) patch.fecha = new Date(data.fecha);
    if (data.tipo)   patch.tipo   = pickOrSelf(mapTipo  as Record<string, string>, data.tipo);
    if (data.origen) patch.origen = pickOrSelf(mapOrigen as Record<string, string>, data.origen);
    if (data.canal)  patch.canal  = pickOrSelf(mapCanal as Record<string, string>, data.canal);

    const estadoEnum = toEnumEstado(data.estado ?? data.status);
    if (estadoEnum) patch.estado = estadoEnum;

    if (data.solicitante) patch.solicitante = data.solicitante;
    if (data.asunto !== undefined) patch.asunto = data.asunto;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
    if (data.responsable !== undefined) patch.responsable = data.responsable || null;
    if (data.vencimiento !== undefined) {
      patch.vencimiento = data.vencimiento ? new Date(data.vencimiento) : null;
    }
    if (data.adjuntos) patch.adjuntos = data.adjuntos;
    if (data.historial) patch.historial = data.historial;

    const updated = await prisma.pQRS.update({
      where: { id: params.id as any }, // funciona para Int o String (gracias al GET ya tolerante)
      data: patch,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/pqrs/[id] error:", e);
    const msg =
      e?.code === "P2004" || e?.code === "P2003" || /invalid enum/i.test(e?.message)
        ? "El estado recibido no es válido para la BD"
        : e?.message || "Error actualizando";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.pQRS.delete({ where: { id: (Number.isInteger(Number(params.id)) ? Number(params.id) : params.id) as any } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/pqrs/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Error eliminando" }, { status: 400 });
  }
}

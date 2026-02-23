import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePQRSBody } from "@/lib/pqrs.schema";
import { mapCanal, mapEstado, mapOrigen, mapTipo } from "@/lib/pqrs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ESTADOS_ENUM = ["ABIERTA", "EN_TRAMITE", "RE_ABIERTO", "CERRADA"] as const;
type EstadoEnum = (typeof ESTADOS_ENUM)[number];

const pickOrSelf = (tbl: Record<string, string>, val?: string) =>
  val !== undefined ? tbl[val] ?? val : undefined;

function toEnumEstado(input?: string | null): EstadoEnum | undefined {
  if (!input) return undefined;

  if (ESTADOS_ENUM.includes(input as EstadoEnum)) return input as EstadoEnum;

  const mapped = (mapEstado as any)[input];
  if (mapped && ESTADOS_ENUM.includes(mapped)) return mapped as EstadoEnum;

  const norm = input.replace(/\s+/g, "_").toUpperCase();
  if (ESTADOS_ENUM.includes(norm as EstadoEnum)) return norm as EstadoEnum;

  return undefined;
}

/** Next15: params puede ser Promise */
async function getParamId(ctx: { params: any }) {
  const p = await ctx.params;
  const raw = String(p?.id ?? "").trim();
  return raw;
}

function parseIntId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  // acepta "1" / "001" como id también
  if (Number.isInteger(n)) return n;
  return null;
}

async function resolveWhereFromRaw(raw: string) {
  const idInt = parseIntId(raw);

  // 1) si parece id numérico, probamos por id
  if (idInt !== null) {
    const row = await prisma.pQRS.findUnique({ where: { id: idInt } as any });
    if (row) return { mode: "id" as const, id: idInt, row };
  }

  // 2) si no existe por id o raw no es numérico, probamos por radicado
  const row2 = await prisma.pQRS.findFirst({ where: { radicado: raw } });
  if (row2) return { mode: "radicado" as const, id: row2.id as any, row: row2 };

  return null;
}

const toIntOrNull = (v: any): number | null => {
  if (v === null || typeof v === "undefined") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
};

/* ================= GET ================= */
export async function GET(_req: NextRequest, ctx: { params: any }) {
  try {
    const raw = await getParamId(ctx);
    if (!raw) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const resolved = await resolveWhereFromRaw(raw);
    if (!resolved) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(resolved.row);
  } catch (e: any) {
    console.error("GET /api/pqrs/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Error obteniendo detalle" }, { status: 500 });
  }
}

/* ================= PATCH ================= */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const rawId = await getParamId(ctx);
    if (!rawId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const resolved = await resolveWhereFromRaw(rawId);
    if (!resolved) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

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
    if (data.tipo) patch.tipo = pickOrSelf(mapTipo as Record<string, string>, data.tipo);
    if (data.origen) patch.origen = pickOrSelf(mapOrigen as Record<string, string>, data.origen);
    if (data.canal) patch.canal = pickOrSelf(mapCanal as Record<string, string>, data.canal);

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

    // ✅ guardar beneficiarioId si llega
    if (data.beneficiarioId !== undefined) {
      patch.beneficiarioId = toIntOrNull(data.beneficiarioId);
    }

    const updated = await prisma.pQRS.update({
      where: { id: resolved.id } as any, // ✅ siempre id INT real
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
export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const rawId = await getParamId(ctx);
    if (!rawId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const resolved = await resolveWhereFromRaw(rawId);
    if (!resolved) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.pQRS.delete({ where: { id: resolved.id } as any });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/pqrs/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Error eliminando" }, { status: 400 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActividadEstado } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEED = [
  { codigo: "A1", nombre: "Actividad 1", presupuesto: 12_000_000 },
  { codigo: "A2", nombre: "Actividad 2", presupuesto: 18_000_000 },
  { codigo: "A3", nombre: "Actividad 3", presupuesto: 22_000_000 },
  { codigo: "A4", nombre: "Actividad 4", presupuesto: 10_000_000 },
  { codigo: "A5", nombre: "Actividad 5", presupuesto: 8_000_000 },
  { codigo: "A6", nombre: "Actividad 6", presupuesto: 7_500_000 },
  { codigo: "A7", nombre: "Actividad 7", presupuesto: 9_500_000 },
  { codigo: "A8", nombre: "Actividad 8", presupuesto: 6_000_000 },
] as const;

const toISO = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

const toInt = (v: any) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};

const norm = (s: any) =>
  String(s ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const estadoToDb = (v: any): ActividadEstado | undefined => {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  const k = norm(v);
  if (k === "ABIERTA" || k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "CERRADA") return ActividadEstado.CERRADA;
  if (k === "ABIERTA" || k === "ABIERTA") return ActividadEstado.ABIERTA;
  // UI
  if (k === "ABIERTA" || k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "ABIERTA" || k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  // "Abierta"/"Cerrada"
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "CERRADA") return ActividadEstado.CERRADA;
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  if (k === "ABIERTA") return ActividadEstado.ABIERTA;

  // fallback final:
  if (k === "ABIERTA" || k === "ABIERTA") return ActividadEstado.ABIERTA;
  if (k === "CERRADA") return ActividadEstado.CERRADA;
  return undefined;
};

const estadoToUi = (v: ActividadEstado | string | null | undefined) =>
  String(v ?? "").toUpperCase() === "CERRADA" ? "Cerrada" : "Abierta";

function toUi(a: any) {
  return {
    id: a.id,
    codigo: a.codigo,
    nombre: a.nombre,
    presupuesto: a.presupuesto,
    estado: estadoToUi(a.estado),
    cerradaEn: toISO(a.cerradaEn),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** GET: lista + seed A1..A8 si no existen */
export async function GET() {
  // seed por codigo (no pisa si ya existe)
  await prisma.$transaction(
    SEED.map((s) =>
      prisma.actividad.upsert({
        where: { codigo: s.codigo },
        update: {},
        create: {
          codigo: s.codigo,
          nombre: s.nombre,
          presupuesto: s.presupuesto,
          estado: ActividadEstado.ABIERTA,
        },
      })
    )
  );

  const items = await prisma.actividad.findMany({ orderBy: { codigo: "asc" } });
  return NextResponse.json({ items: items.map(toUi) }, { headers: { "cache-control": "no-store" } });
}

/**
 * PATCH:
 * - single: { id, presupuesto?, estado?, nombre? }
 * - bulk:   { items: [{ id, presupuesto?, estado?, nombre? }, ...] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const items = Array.isArray(body?.items) ? body.items : [body];

    const updates = items
      .map((x: any) => {
        const id = toInt(x?.id);
        if (!id) return null;

        const data: any = {};
        if (typeof x?.presupuesto !== "undefined") data.presupuesto = Number(x.presupuesto ?? 0);
        if (typeof x?.nombre !== "undefined") data.nombre = String(x.nombre ?? "").trim() || "Actividad";
        if (typeof x?.estado !== "undefined") {
          const est = estadoToDb(x.estado);
          if (est) {
            data.estado = est;
            if (est === ActividadEstado.CERRADA) data.cerradaEn = new Date();
            if (est === ActividadEstado.ABIERTA) data.cerradaEn = null;
          }
        }

        return { id, data };
      })
      .filter(Boolean) as Array<{ id: number; data: any }>;

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    }

    const res = await prisma.$transaction(
      updates.map((u) =>
        prisma.actividad.update({
          where: { id: u.id },
          data: u.data,
        })
      )
    );

    return NextResponse.json({ items: res.map(toUi) }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("PATCH /api/costos/actividades error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActividadEstado } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (k === "ABIERTA") return ActividadEstado.ABIERTA;
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
    cerradaEn: a.cerradaEn ? a.cerradaEn.toISOString().slice(0, 10) : null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** GET: lista */
export async function GET() {
  const items = await prisma.actividad.findMany({ orderBy: { codigo: "asc" } });
  return NextResponse.json({ items: items.map(toUi) }, { headers: { "cache-control": "no-store" } });
}

/** POST: crear actividad */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const codigo = String(body?.codigo ?? "").trim().toUpperCase();
    const nombre = String(body?.nombre ?? "").trim();
    const presupuesto = toInt(body?.presupuesto) ?? 0;

    if (!codigo) return NextResponse.json({ error: "codigo es requerido" }, { status: 400 });
    if (!nombre) return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });

    const estado = estadoToDb(body?.estado) ?? ActividadEstado.ABIERTA;

    const created = await prisma.actividad.create({
      data: {
        codigo,
        nombre,
        presupuesto,
        estado,
        cerradaEn: estado === ActividadEstado.CERRADA ? new Date() : null,
      },
    });

    return NextResponse.json(toUi(created), { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una actividad con ese código." }, { status: 409 });
    }
    console.error("POST /api/costos/actividades error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/**
 * PATCH:
 * - single: { id, presupuesto?, estado?, nombre? }
 * - bulk:   { items: [{ id, presupuesto?, estado?, nombre? }, ...] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [body];

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
            data.cerradaEn = est === ActividadEstado.CERRADA ? new Date() : null;
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
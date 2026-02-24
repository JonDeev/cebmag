import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GastoCategoria, MetodoPago } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params;
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

const norm = (s: any) =>
  String(s ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const catToDb = (v: any): GastoCategoria | undefined => {
  if (v === undefined) return undefined;
  if (v === null || String(v).trim() === "") return undefined;
  const k = norm(v);
  const map: Record<string, GastoCategoria> = {
    PERSONAL: GastoCategoria.PERSONAL,
    HONORARIOS: GastoCategoria.HONORARIOS,
    TRANSPORTE: GastoCategoria.TRANSPORTE,
    INSUMOS: GastoCategoria.INSUMOS,
    ALQUILER: GastoCategoria.ALQUILER,
    PAPELERIA: GastoCategoria.PAPELERIA,
    LOGISTICA: GastoCategoria.LOGISTICA,
    OTROS: GastoCategoria.OTROS,
  };
  return map[k];
};

const metodoToDb = (v: any): MetodoPago | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null || String(v).trim() === "") return null;
  const k = norm(v);
  const map: Record<string, MetodoPago> = {
    EFECTIVO: MetodoPago.EFECTIVO,
    TRANSFERENCIA: MetodoPago.TRANSFERENCIA,
    CHEQUE: MetodoPago.CHEQUE,
    OTRO: MetodoPago.OTRO,
  };
  return map[k] ?? null;
};

const toDateOrNull = (s: any) => {
  if (s === undefined) return undefined;
  if (s === null || String(s).trim() === "") return null;
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export async function PATCH(req: Request, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();

    const data: any = {};
    if (typeof body.fecha !== "undefined") data.fecha = toDateOrNull(body.fecha);
    if (typeof body.actividadId !== "undefined") data.actividadId = Number(body.actividadId);
    if (typeof body.categoria !== "undefined") {
      const c = catToDb(body.categoria);
      if (c) data.categoria = c;
    }
    if (typeof body.descripcion !== "undefined") data.descripcion = String(body.descripcion ?? "").trim();
    if (typeof body.proveedor !== "undefined") data.proveedor = String(body.proveedor ?? "").trim() || null;
    if (typeof body.metodo !== "undefined") data.metodo = metodoToDb(body.metodo);
    if (typeof body.documento !== "undefined") data.documento = String(body.documento ?? "").trim() || null;
    if (typeof body.valor !== "undefined") data.valor = Number(body.valor ?? 0);
    if (typeof body.adjuntos !== "undefined") data.adjuntos = Array.isArray(body.adjuntos) ? body.adjuntos : [];

    const updated = await prisma.gasto.update({ where: { id }, data });
    return NextResponse.json(updated, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("PATCH /api/costos/gastos/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    await prisma.gasto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/costos/gastos/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
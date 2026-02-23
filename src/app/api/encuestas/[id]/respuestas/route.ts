import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params; // ✅ soporta objeto o Promise
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export async function POST(req: Request, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // (Opcional) valida que exista la encuesta
    const enc = await prisma.encuesta.findUnique({
      where: { id }, // ✅ Int
      select: { id: true },
    });

    if (!enc) {
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    // ✅ Crea respuesta ligada a encuestaId (Int)
    const created = await prisma.respuesta.create({
      data: {
        encuestaId: id,
        tipo_doc: body?.tipo_doc ?? null,
        documento: body?.documento ?? null,
        nombre: body?.nombre ?? null,
        valores: body?.valores ?? {}, // Json
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("[API respuestas] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
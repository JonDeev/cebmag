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

export async function GET(_req: Request, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const encuesta = await prisma.encuesta.findUnique({
      where: { id }, // ✅ Int
      include: { respuestas: true },
    });

    if (!encuesta) {
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(encuesta, { status: 200 });
  } catch (e: any) {
    console.error("Error al obtener resultados:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js 15+: params es "async". Debes esperarlo.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // ✅ await
    if (!id) {
      return NextResponse.json(
        { error: "Falta el parámetro id de la encuesta" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const respondente = body?.respondente ?? {};
    const valores = body?.valores ?? {};

    if (!valores || typeof valores !== "object" || Array.isArray(valores)) {
      return NextResponse.json(
        { error: "El campo 'valores' es obligatorio y debe ser un objeto" },
        { status: 400 }
      );
    }

    // (Opcional) valida que exista la encuesta
    const enc = await prisma.encuesta.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!enc) {
      return NextResponse.json(
        { error: "Encuesta no encontrada" },
        { status: 404 }
      );
    }

    // ✅ Tu schema actual no tiene 'respondente' JSON; usa estos campos:
    // Respuesta { id, encuestaId, fecha, tipo_doc?, documento?, nombre?, valores Json, ... }
    const created = await prisma.respuesta.create({
      data: {
        encuestaId: id,
        tipo_doc: respondente.tipo_doc ?? null,
        documento: respondente.doc ?? null,
        nombre: respondente.nombre ?? null,
        valores,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[API respuestas] error:", err);
    return NextResponse.json(
      { error: err?.message || "Error inesperado al guardar la respuesta" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Crea una nueva respuesta asociada a una encuesta.
 * Endpoint: POST /api/encuestas/[id]/respuestas
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Validaciones mínimas
    if (!body.valores || typeof body.valores !== "object") {
      return NextResponse.json({ error: "Faltan valores de respuesta válidos" }, { status: 400 });
    }

    // Crear respuesta en la BD
    const respuesta = await prisma.respuesta.create({
      data: {
        encuestaId: params.id,
        tipo_doc: body.respondente?.tipo_doc || null,
        documento: body.respondente?.doc || null,
        nombre: body.respondente?.nombre || null,
        valores: body.valores,
      },
    });

    return NextResponse.json(respuesta, { status: 201 });
  } catch (error) {
    console.error("❌ Error al guardar respuesta:", error);
    return NextResponse.json({ error: "Error interno al guardar respuesta" }, { status: 500 });
  }
}

/**
 * Lista todas las respuestas de una encuesta.
 * Endpoint: GET /api/encuestas/[id]/respuestas
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const respuestas = await prisma.respuesta.findMany({
      where: { encuestaId: params.id },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(respuestas);
  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    return NextResponse.json({ error: "Error interno al obtener respuestas" }, { status: 500 });
  }
}

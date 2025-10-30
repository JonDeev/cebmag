import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET → listar encuestas (ok dejar respuestas como include)
export async function GET() {
  const encuestas = await prisma.encuesta.findMany({
    orderBy: { creada: "desc" },
    include: { respuestas: true }, // 'preguntas' es JSON, no se incluye
  });
  return NextResponse.json(encuestas, {
    headers: { "cache-control": "no-store" },
  });
}

// POST → crear nueva encuesta
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Normaliza preguntas (JSON)
    const preguntas = Array.isArray(data.preguntas)
      ? data.preguntas.map((p: any) => ({
          id: p.id ?? p.tempId ?? (globalThis.crypto?.randomUUID?.() ?? `q_${Math.random().toString(36).slice(2)}`),
          texto: String(p.texto ?? ""),
          tipo: p.tipo, // "likert" | "si_no" | "opciones" | "texto"
          opciones: Array.isArray(p.opciones) ? p.opciones : [],
        }))
      : [];

    const nueva = await prisma.encuesta.create({
      data: {
        titulo: String(data.titulo ?? "Nueva encuesta"),
        servicio: String(data.servicio ?? ""),
        estado: String(data.estado ?? "BORRADOR").toUpperCase() as any, // enum
        descripcion: data.descripcion ?? null,
        preguntas, // 👈 se guarda como JSON
      },
    });

    // Opcional: devuelve respuestas vacías para que el front no falle al mapear
    return NextResponse.json({ ...nueva, respuestas: [] }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error: any) {
    console.error("Error al crear encuesta:", error);
    return NextResponse.json(
      { error: error?.message ?? "Error al crear encuesta" },
      { status: 500 }
    );
  }
}

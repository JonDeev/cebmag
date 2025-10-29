import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET → listar todas las encuestas
export async function GET() {
  const encuestas = await prisma.encuesta.findMany({
    orderBy: { creada: "desc" },
    include: { respuestas: true },
  });
  return NextResponse.json(encuestas);
}

// POST → crear nueva encuesta
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const nueva = await prisma.encuesta.create({
      data: {
        titulo: data.titulo,
        servicio: data.servicio,
        estado: data.estado ?? "BORRADOR",
        descripcion: data.descripcion ?? "",
        preguntas: data.preguntas ?? [],
      },
    });

    return NextResponse.json(nueva);
  } catch (error: any) {
    console.error("Error al crear encuesta:", error);
    return NextResponse.json({ error: "Error al crear encuesta" }, { status: 500 });
  }
}

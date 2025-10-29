import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST → registrar respuesta
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const respuesta = await prisma.respuesta.create({
      data: {
        encuestaId: data.encuestaId,
        respondente: data.respondente ?? {},
        valores: data.valores ?? {},
      },
    });

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error al registrar respuesta:", error);
    return NextResponse.json({ error: "Error al guardar respuesta" }, { status: 500 });
  }
}

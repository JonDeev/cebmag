import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  const encuesta = await prisma.encuesta.findUnique({
    where: { id: params.id },
    include: { respuestas: true },
  });
  if (!encuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(encuesta);
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const data = await req.json();

    const updated = await prisma.encuesta.update({
      where: { id: params.id },
      data: {
        titulo: data.titulo,
        servicio: data.servicio,
        estado: data.estado,
        descripcion: data.descripcion,
        preguntas: data.preguntas,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar encuesta" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.encuesta.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar encuesta" }, { status: 500 });
  }
}

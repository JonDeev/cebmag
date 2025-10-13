import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePQRSBody } from "@/lib/pqrs.schema";
import { mapCanal, mapEstado, mapOrigen, mapTipo } from "@/lib/pqrs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = await prisma.pQRS.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const data = updatePQRSBody.parse(json);

    const patch: any = {};
    if (data.fecha) patch.fecha = new Date(data.fecha);
    if (data.tipo) patch.tipo = mapTipo[data.tipo];
    if (data.estado) patch.estado = mapEstado[data.estado];
    if (data.origen) patch.origen = mapOrigen[data.origen];
    if (data.canal) patch.canal = mapCanal[data.canal];
    if (data.solicitante) patch.solicitante = data.solicitante;
    if (data.asunto !== undefined) patch.asunto = data.asunto;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
    if (data.responsable !== undefined) patch.responsable = data.responsable || null;
    if (data.vencimiento !== undefined)
      patch.vencimiento = data.vencimiento ? new Date(data.vencimiento) : null;
    if (data.adjuntos) patch.adjuntos = data.adjuntos;
    if (data.historial) patch.historial = data.historial;

    const updated = await prisma.pQRS.update({
      where: { id: params.id },
      data: patch,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Error actualizando" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.pQRS.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error eliminando" }, { status: 400 });
  }
}

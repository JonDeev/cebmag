import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPQRSBody } from "@/lib/pqrs.schema";
import { mapCanal, mapEstado, mapOrigen, mapTipo, nextRadicadoPQRS } from "@/lib/pqrs";

// GET /api/pqrs?q=&estado=&tipo=&page=1&pageSize=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const estado = searchParams.get("estado") as keyof typeof mapEstado | null;
  const tipo = searchParams.get("tipo") as keyof typeof mapTipo | null;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10)));

  const where: any = {};
  if (estado && mapEstado[estado]) where.estado = mapEstado[estado];
  if (tipo && mapTipo[tipo]) where.tipo = mapTipo[tipo];
  if (q) {
    where.OR = [
      { radicado: { contains: q, mode: "insensitive" } },
      { asunto: { contains: q, mode: "insensitive" } },
      { responsable: { contains: q, mode: "insensitive" } },
      // NOTA: filtrar por campos dentro de JSON (solicitante) con Prisma es limitado,
      // por simplicidad nos quedamos con estos campos; si necesitas buscar nombre/doc, podemos usar raw SQL/GIN.
    ];
  }

  const [total, items] = await Promise.all([
    prisma.pQRS.count({ where }),
    prisma.pQRS.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { radicado: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = createPQRSBody.parse(json);

    const radicado = data.radicado || (await nextRadicadoPQRS());
    const fechaISO = data.fecha ? new Date(data.fecha) : new Date();
    const vencISO = data.vencimiento ? new Date(data.vencimiento) : null;

    const created = await prisma.pQRS.create({
      data: {
        radicado,
        fecha: fechaISO,
        tipo: mapTipo[data.tipo],
        estado: mapEstado[data.estado || "Abierta"],
        origen: mapOrigen[data.origen],
        canal: mapCanal[data.canal],
        solicitante: data.solicitante,
        asunto: data.asunto,
        descripcion: data.descripcion,
        responsable: data.responsable || null,
        vencimiento: vencISO,
        adjuntos: data.adjuntos ?? [],
        historial: data.historial ?? [],
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Error creando PQRS" }, { status: 400 });
  }
}

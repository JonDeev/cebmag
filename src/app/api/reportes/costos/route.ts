import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CAT_UI, endOfDayUTC, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const d1 = (url.searchParams.get("d1") ?? "").trim();
  const d2 = (url.searchParams.get("d2") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();

  const where: any = { AND: [] as any[] };

  if (d1) where.AND.push({ fecha: { gte: startOfDayUTC(d1) } });
  if (d2) where.AND.push({ fecha: { lte: endOfDayUTC(d2) } });

  if (q) {
    where.AND.push({
      OR: [
        { descripcion: { contains: q, mode: "insensitive" } },
        { proveedor: { contains: q, mode: "insensitive" } },
        { documento: { contains: q, mode: "insensitive" } },
        { actividad: { codigo: { contains: q, mode: "insensitive" } } },
        { actividad: { nombre: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (!where.AND.length) delete where.AND;

  const gastos = await prisma.gasto.findMany({
    where,
    take: 500,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    include: { actividad: { select: { codigo: true, nombre: true } } },
  });

  const rows = gastos.map((g) => ({
    fecha: toYMD(g.fecha),
    actividad: `${g.actividad?.codigo ?? ""} • ${g.actividad?.nombre ?? ""}`.trim() || `Actividad ${g.actividadId}`,
    categoria: CAT_UI[String(g.categoria)] ?? String(g.categoria ?? ""),
    descripcion: g.descripcion ?? "",
    valor: Number(g.valor ?? 0),
  }));

  return NextResponse.json({ items: rows });
}
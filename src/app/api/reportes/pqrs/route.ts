import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endOfDayUTC, pqrsCanalToUi, pqrsOrigenToUi, pqrsStatusToUi, pqrsTipoToUi, solicitanteLabel, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";

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
        { radicado: { contains: q, mode: "insensitive" } },
        { asunto: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
        { responsable: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (!where.AND.length) delete where.AND;

  const items = await prisma.pQRS.findMany({
    where,
    take: 500,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });

  const rows = items.map((r) => ({
    radicado: String(r.radicado ?? ""),
    fecha: toYMD(r.fecha),
    tipo: pqrsTipoToUi(r.tipo),
    estado: pqrsStatusToUi(r.estado),
    origen: pqrsOrigenToUi(r.origen),
    canal: pqrsCanalToUi(r.canal),
    solicitante: solicitanteLabel(r.solicitante) || "—",
    asunto: String(r.asunto ?? ""),
    responsable: String(r.responsable ?? "—"),
    vencimiento: r.vencimiento ? toYMD(r.vencimiento) : "",
  }));

  return NextResponse.json({ items: rows });
}
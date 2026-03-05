import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  beneficiarioNombre,
  entregaEstadoToUi,
  endOfDayUTC,
  startOfDayUTC,
  toYMD,
  itemsToText,
} from "@/lib/reportes/serverUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function itemsCount(items: any) {
  if (!items) return 0;
  if (Array.isArray(items)) return items.length;
  return 1;
}

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
        { comprobante: { contains: q, mode: "insensitive" } },
        { responsable: { contains: q, mode: "insensitive" } },
        { observaciones: { contains: q, mode: "insensitive" } },
        { kit: { contains: q, mode: "insensitive" } },
        { beneficiario: { doc: { contains: q, mode: "insensitive" } } },
        { beneficiario: { nombres: { contains: q, mode: "insensitive" } } },
        { beneficiario: { apellidos: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (!where.AND.length) delete where.AND;

  const entregas = await prisma.entrega.findMany({
    where,
    take: 500,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    include: {
      beneficiario: {
        select: {
          doc: true,
          nombres: true,
          apellidos: true,
          primerNombre: true,
          segundoNombre: true,
          primerApellido: true,
          segundoApellido: true,
        },
      },
      kitRef: { select: { nombre: true } },
    },
  });

  const rows = entregas.map((e) => {
    const ben = e.beneficiario;
    const doc = String(ben?.doc ?? "").trim();
    const kit = String(e.kit ?? e.kitRef?.nombre ?? "").trim();

    return {
      comprobante: String(e.comprobante ?? ""),
      fecha: toYMD(e.fecha),
      doc,
      beneficiario: beneficiarioNombre(ben) || "—",
      responsable: String(e.responsable ?? "—"),
      estado: entregaEstadoToUi(e.estado),
      kit,
      items: String(itemsCount(e.items)),

      // ✅ NUEVO: productos entregados (formateado desde el JSON items)
      productos: itemsToText(e.items),

      obs: String(e.observaciones ?? ""),
    };
  });

  return NextResponse.json({ items: rows });
}
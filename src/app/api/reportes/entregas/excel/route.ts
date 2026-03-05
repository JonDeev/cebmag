import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  beneficiarioNombre,
  entregaEstadoToUi,
  endOfDayUTC,
  itemsToText,
  startOfDayUTC,
  toYMD,
} from "@/lib/reportes/serverUtils";
import { newWb, styleBody, styleHeader } from "@/lib/reportes/excel";

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
        { beneficiario: { primerNombre: { contains: q, mode: "insensitive" } } },
        { beneficiario: { primerApellido: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (!where.AND.length) delete where.AND;

  const items = await prisma.entrega.findMany({
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

  const wb = newWb();
  const ws = wb.addWorksheet("Entregas", { views: [{ state: "frozen", ySplit: 1 }] });

  const cols = [
    { title: "Comprobante", key: "comprobante", width: 18 },
    { title: "Fecha", key: "fecha", width: 12 },
    { title: "Documento", key: "doc", width: 16, numFmt: "@" },
    { title: "Beneficiario", key: "beneficiario", width: 28 },
    { title: "Responsable", key: "responsable", width: 18 },
    { title: "Estado", key: "estado", width: 12 },
    { title: "Kit", key: "kit", width: 18 },
    { title: "Items (#)", key: "items", width: 10 },
    { title: "Productos entregados", key: "productos", width: 48 },
    { title: "Observaciones", key: "obs", width: 30 },
  ];

  ws.columns = cols.map((c) => ({
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  })) as any;

  ws.addRow(cols.map((c) => c.title));
  styleHeader(ws, 1, cols.length);

  for (const e of items) {
    const ben = e.beneficiario;
    ws.addRow({
      comprobante: String(e.comprobante ?? ""),
      fecha: toYMD(e.fecha),
      doc: String(ben?.doc ?? ""),
      beneficiario: beneficiarioNombre(ben) || "—",
      responsable: String(e.responsable ?? "—"),
      estado: entregaEstadoToUi(e.estado),
      kit: String(e.kit ?? e.kitRef?.nombre ?? ""),
      items: String(itemsCount(e.items)),
      productos: itemsToText(e.items),
      obs: String(e.observaciones ?? ""),
    });
  }

  ws.autoFilter = { from: "A1", to: ws.getCell(1, cols.length).address };
  styleBody(ws, 2);

  const buf = await wb.xlsx.writeBuffer();
  const file = Buffer.from(buf);
  const filename = `entregas-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
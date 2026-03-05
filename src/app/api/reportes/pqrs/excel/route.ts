import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  endOfDayUTC,
  pqrsCanalToUi,
  pqrsOrigenToUi,
  pqrsStatusToUi,
  pqrsTipoToUi,
  solicitanteLabel,
  startOfDayUTC,
  toYMD,
} from "@/lib/reportes/serverUtils";
import { newWb, styleBody, styleHeader } from "@/lib/reportes/excel";

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

  // Nota: Prisma suele exponer este modelo como prisma.pQRS (por tu schema)
  const items = await prisma.pQRS.findMany({
    where,
    take: 500,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });

  const wb = newWb();
  const ws = wb.addWorksheet("PQRS", { views: [{ state: "frozen", ySplit: 1 }] });

  const cols = [
    { title: "Radicado", key: "radicado", width: 16 },
    { title: "Fecha", key: "fecha", width: 12 },
    { title: "Tipo", key: "tipo", width: 14 },
    { title: "Estado", key: "estado", width: 12 },
    { title: "Origen", key: "origen", width: 12 },
    { title: "Canal", key: "canal", width: 12 },
    { title: "Solicitante", key: "solicitante", width: 26 },
    { title: "Asunto", key: "asunto", width: 30 },
    { title: "Responsable", key: "responsable", width: 18 },
    { title: "Vencimiento", key: "vencimiento", width: 12 },
  ];

  ws.columns = cols.map((c) => ({ key: c.key, width: c.width })) as any;

  ws.addRow(cols.map((c) => c.title));
  styleHeader(ws, 1, cols.length);

  for (const r of items) {
    ws.addRow({
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
    });
  }

  ws.autoFilter = { from: "A1", to: ws.getCell(1, cols.length).address };
  styleBody(ws, 2);

  const buf = await wb.xlsx.writeBuffer();
  const file = Buffer.from(buf);
  const filename = `pqrs-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
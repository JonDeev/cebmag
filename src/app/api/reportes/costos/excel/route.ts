import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CAT_UI, endOfDayUTC, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";
import { moneyFmt, newWb, styleBody, styleHeader } from "@/lib/reportes/excel";

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

  const [acts, gastos] = await Promise.all([
    prisma.actividad.findMany({
      orderBy: { codigo: "asc" },
      select: { id: true, codigo: true, nombre: true, presupuesto: true },
    }),
    prisma.gasto.findMany({
      where,
      take: 500,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      include: { actividad: { select: { id: true, codigo: true, nombre: true, presupuesto: true } } },
    }),
  ]);

  const execByAct: Record<number, number> = {};
  for (const g of gastos) execByAct[g.actividadId] = (execByAct[g.actividadId] || 0) + (g.valor || 0);

  const wb = newWb();

  // ✅ Sheet 1: Detalle (sin título arriba)
  const ws = wb.addWorksheet("Detalle", { views: [{ state: "frozen", ySplit: 1 }] });

const cols = [
  { title: "Fecha", key: "fecha", width: 12, numFmt: "dd/mm/yyyy" },
  { title: "Actividad", key: "actividad", width: 32 },
  { title: "Categoría", key: "categoria", width: 14 },
  { title: "Descripción", key: "descripcion", width: 34 },
  { title: "Proveedor", key: "proveedor", width: 20 },
  { title: "Documento", key: "documento", width: 16, numFmt: "@" },
  { title: "Valor", key: "valor", width: 14, numFmt: '"$"#,##0' },
];

// ✅ columnas SIN header (para que no cree fila 1 automática)
ws.columns = cols.map((c) => ({
  key: c.key,
  width: c.width,
  style: c.numFmt ? { numFmt: c.numFmt } : undefined,
})) as any;

// ✅ header manual (una sola vez)
ws.addRow(cols.map((c) => c.title));
styleHeader(ws, 1, cols.length);

ws.autoFilter = { from: "A1", to: ws.getCell(1, cols.length).address };
styleBody(ws, 2);
  styleHeader(ws, 1, cols.length);

  for (const g of gastos) {
    ws.addRow({
      fecha: toYMD(g.fecha),
      actividad: `${g.actividad?.codigo ?? ""} • ${g.actividad?.nombre ?? ""}`.trim() || `Actividad ${g.actividadId}`,
      categoria: CAT_UI[String(g.categoria)] ?? String(g.categoria ?? ""),
      descripcion: g.descripcion ?? "",
      proveedor: g.proveedor ?? "",
      documento: g.documento ?? "",
      valor: Number(g.valor ?? 0),
    });
  }

  ws.getColumn("valor").numFmt = moneyFmt;
  ws.autoFilter = { from: "A1", to: ws.getCell(1, cols.length).address };
  styleBody(ws, 2);

  // ✅ Sheet 2: Resumen (también sin título arriba)
  const rs = wb.addWorksheet("Resumen", { views: [{ state: "frozen", ySplit: 1 }] });

  const rCols = [
    { header: "Código", key: "codigo", width: 10 },
    { header: "Nombre", key: "nombre", width: 30 },
    { header: "Presupuesto", key: "presupuesto", width: 14 },
    { header: "Ejecutado (filtrado)", key: "ejecutado", width: 18 },
    { header: "Disponible (estimado)", key: "disponible", width: 18 },
    { header: "Ejecución %", key: "pct", width: 12 },
  ];

  rs.columns = rCols as any;

  rs.addRow(rCols.map((c) => c.header));
  styleHeader(rs, 1, rCols.length);

  for (const a of acts) {
    const ejecutado = execByAct[a.id] || 0;
    const presupuesto = a.presupuesto || 0;
    const disponible = presupuesto - ejecutado;
    const pct = presupuesto ? ejecutado / presupuesto : 0;

    const row = rs.addRow({
      codigo: a.codigo,
      nombre: a.nombre,
      presupuesto,
      ejecutado,
      disponible,
      pct,
    });

    row.getCell(3).numFmt = moneyFmt;
    row.getCell(4).numFmt = moneyFmt;
    row.getCell(5).numFmt = moneyFmt;
    row.getCell(6).numFmt = "0%";
  }

  rs.autoFilter = { from: "A1", to: rs.getCell(1, rCols.length).address };
  styleBody(rs, 2);

  const buf = await wb.xlsx.writeBuffer();
  const file = Buffer.from(buf);
  const filename = `costos-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
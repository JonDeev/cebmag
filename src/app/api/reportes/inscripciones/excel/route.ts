import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endOfDayUTC, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";
import { moneyFmt, newWb, styleBody, styleHeader } from "@/lib/reportes/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function candidatoNombre(c: any) {
  if (!c || typeof c !== "object") return "";
  const n = String(c?.nombres ?? "").trim();
  const a = String(c?.apellidos ?? "").trim();
  return `${n} ${a}`.trim();
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
        { radicado: { contains: q, mode: "insensitive" } },
        { cargo: { contains: q, mode: "insensitive" } },
        { actividad: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (!where.AND.length) delete where.AND;

  const items = await prisma.inscripcion.findMany({
    where,
    take: 500,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    include: { contrato: true },
  });

  const wb = newWb();
  const ws = wb.addWorksheet("Inscripciones", { views: [{ state: "frozen", ySplit: 1 }] });

  const cols = [
    { title: "Radicado", key: "radicado", width: 16 },
    { title: "Fecha", key: "fecha", width: 12 },
    { title: "Tipo", key: "tipo", width: 16 },
    { title: "Candidato", key: "candidato", width: 26 },
    { title: "Documento", key: "doc", width: 16, numFmt: "@" },
    { title: "Cargo", key: "cargo", width: 22 },
    { title: "Actividad", key: "actividad", width: 18 },
    { title: "Estado", key: "estado", width: 18 },
    { title: "Puntaje", key: "puntaje", width: 10 },
    { title: "Decisión", key: "decision", width: 12 },
    { title: "Modalidad", key: "modalidad", width: 22 },
    { title: "Valor", key: "valor", width: 14, numFmt: moneyFmt },
    { title: "Inicio", key: "inicio", width: 12 },
    { title: "Fin", key: "fin", width: 12 },
  ];

  ws.columns = cols.map((c) => ({
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  })) as any;

  ws.addRow(cols.map((c) => c.title));
  styleHeader(ws, 1, cols.length);

  for (const r of items) {
    const cand = r.candidato as any;
    const nombre = candidatoNombre(cand) || "—";
    const doc = String(cand?.doc ?? "").trim();

    const ev = (r.evaluacion as any) ?? {};
    const puntaje = typeof ev?.puntaje === "number" ? ev.puntaje : "";
    const decision = String(ev?.decision ?? "");

    const c = r.contrato;
    const valorNum = c?.valor ?? null;

    ws.addRow({
      radicado: String(r.radicado ?? ""),
      fecha: toYMD(r.fecha),
      tipo: String(r.tipo ?? ""),
      candidato: nombre,
      doc,
      cargo: String(r.cargo ?? ""),
      actividad: String(r.actividad ?? ""),
      estado: String(r.estado ?? ""),
      puntaje,
      decision,
      modalidad: c ? String(c.modalidad ?? "") : "",
      valor: typeof valorNum === "number" ? valorNum : "",
      inicio: c?.inicio ? toYMD(c.inicio) : "",
      fin: c?.fin ? toYMD(c.fin) : "",
    });
  }

  ws.autoFilter = { from: "A1", to: ws.getCell(1, cols.length).address };
  styleBody(ws, 2);

  const buf = await wb.xlsx.writeBuffer();
  const file = Buffer.from(buf);
  const filename = `inscripciones-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
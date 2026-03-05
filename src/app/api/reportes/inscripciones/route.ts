import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endOfDayUTC, safeJsonString, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";

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

  const rows = items.map((r) => {
    const cand = r.candidato as any;
    const nombre = candidatoNombre(cand) || "—";
    const doc = String(cand?.doc ?? "").trim();

    const ev = (r.evaluacion as any) ?? {};
    const puntaje = typeof ev?.puntaje === "number" ? ev.puntaje : "";
    const decision = String(ev?.decision ?? "");

    const c = r.contrato;
    return {
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
      valor: c ? String(c.valor ?? "") : "",
      inicio: c?.inicio ? toYMD(c.inicio) : "",
      fin: c?.fin ? toYMD(c.fin) : "",
    };
  });

  return NextResponse.json({ items: rows });
}
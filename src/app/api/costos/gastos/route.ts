import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GastoCategoria, MetodoPago } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toISO = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

const toInt = (v: any) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};

const norm = (s: any) =>
  String(s ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const catToDb = (v: any): GastoCategoria | undefined => {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  const k = norm(v);

  const map: Record<string, GastoCategoria> = {
    PERSONAL: GastoCategoria.PERSONAL,
    HONORARIOS: GastoCategoria.HONORARIOS,
    TRANSPORTE: GastoCategoria.TRANSPORTE,
    INSUMOS: GastoCategoria.INSUMOS,
    ALQUILER: GastoCategoria.ALQUILER,
    PAPELERIA: GastoCategoria.PAPELERIA,
    LOGISTICA: GastoCategoria.LOGISTICA,
    OTROS: GastoCategoria.OTROS,

    // UI
    "PAPELERIA": GastoCategoria.PAPELERIA,
    "LOGISTICA": GastoCategoria.LOGISTICA,
  };

  // si viene “Papelería” o “Logística”, al normalizar queda sin acento
  return map[k] ?? undefined;
};

const metodoToDb = (v: any): MetodoPago | undefined => {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  const k = norm(v);

  const map: Record<string, MetodoPago> = {
    EFECTIVO: MetodoPago.EFECTIVO,
    TRANSFERENCIA: MetodoPago.TRANSFERENCIA,
    CHEQUE: MetodoPago.CHEQUE,
    OTRO: MetodoPago.OTRO,

    // UI
    "EFECTIVO": MetodoPago.EFECTIVO,
    "TRANSFERENCIA": MetodoPago.TRANSFERENCIA,
    "CHEQUE": MetodoPago.CHEQUE,
    "OTRO": MetodoPago.OTRO,
  };

  return map[k] ?? undefined;
};

const catToUi: Record<string, string> = {
  PERSONAL: "Personal",
  HONORARIOS: "Honorarios",
  TRANSPORTE: "Transporte",
  INSUMOS: "Insumos",
  ALQUILER: "Alquiler",
  PAPELERIA: "Papelería",
  LOGISTICA: "Logística",
  OTROS: "Otros",
};

const metodoToUi: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  CHEQUE: "Cheque",
  OTRO: "Otro",
};

const toDateOrNull = (s: any) => {
  if (s === null || typeof s === "undefined" || String(s).trim() === "") return null;
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

function toUi(g: any) {
  return {
    id: g.id,
    fecha: toISO(g.fecha),
    actividadId: g.actividadId,
    categoria: catToUi[String(g.categoria)] ?? String(g.categoria),
    descripcion: g.descripcion ?? "",
    proveedor: g.proveedor ?? "",
    metodo: g.metodo ? (metodoToUi[String(g.metodo)] ?? String(g.metodo)) : "",
    documento: g.documento ?? "",
    valor: g.valor ?? 0,
    adjuntos: Array.isArray(g.adjuntos) ? g.adjuntos : [],
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

/* GET /api/costos/gastos?q=&actividadId=&categoria=&d1=&d2=&page=&pageSize= */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const actividadId = toInt(searchParams.get("actividadId"));
  const categoria = searchParams.get("categoria");
  const d1 = searchParams.get("d1");
  const d2 = searchParams.get("d2");

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? 50)));
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (actividadId) where.actividadId = actividadId;

  const catDb = catToDb(categoria);
  if (catDb) where.categoria = catDb;

  const from = toDateOrNull(d1);
  const to = toDateOrNull(d2);
  if (from || to) {
    where.fecha = {};
    if (from) where.fecha.gte = from;
    if (to) where.fecha.lte = to;
  }

  if (q) {
    where.OR = [
      { descripcion: { contains: q, mode: "insensitive" } },
      { proveedor: { contains: q, mode: "insensitive" } },
      { documento: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.gasto.count({ where }),
    prisma.gasto.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json(
    { total, page, pageSize, items: items.map(toUi) },
    { headers: { "cache-control": "no-store" } }
  );
}

/* POST /api/costos/gastos */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const actividadId = toInt(body?.actividadId);
    const fecha = toDateOrNull(body?.fecha) ?? new Date();
    const categoria = catToDb(body?.categoria) ?? GastoCategoria.INSUMOS;

    const descripcion = String(body?.descripcion ?? "").trim();
    const valor = Number(body?.valor ?? 0);

    if (!actividadId) return NextResponse.json({ error: "actividadId inválido" }, { status: 400 });
    if (!descripcion) return NextResponse.json({ error: "La descripción es obligatoria" }, { status: 400 });
    if (!Number.isFinite(valor) || valor <= 0) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

    const created = await prisma.gasto.create({
      data: {
        fecha,
        actividadId,
        categoria,
        descripcion,
        proveedor: String(body?.proveedor ?? "").trim() || null,
        metodo: metodoToDb(body?.metodo) ?? null,
        documento: String(body?.documento ?? "").trim() || null,
        valor,
        adjuntos: Array.isArray(body?.adjuntos) ? body.adjuntos : [],
      },
    });

    return NextResponse.json(toUi(created), { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("POST /api/costos/gastos error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, EntregaEstado, TipoDocumento } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= Helpers ================= */
const toISO = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const toDateOrNull = (s: any) => {
  if (s === null || typeof s === "undefined" || String(s).trim() === "") return null;
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
};
const asArr = (v: any) => (Array.isArray(v) ? v : []);
const asObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const toInt = (v: any) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};

const estadoToDb: Record<string, EntregaEstado> = {
  Pendiente: "PENDIENTE",
  Parcial: "PARCIAL",
  Entregado: "ENTREGADO",
  PENDIENTE: "PENDIENTE",
  PARCIAL: "PARCIAL",
  ENTREGADO: "ENTREGADO",
};

const estadoToUi: Record<string, "Pendiente" | "Parcial" | "Entregado"> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  ENTREGADO: "Entregado",
};

function upper(v: any) {
  if (v === null || typeof v === "undefined") return v;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t ? t.toUpperCase() : "";
}

function packAdjuntos(files: any, direccionEntrega?: string) {
  const f = asArr(files)
    .map((x) => ({ name: String(x?.name ?? x?.nombre ?? "").trim(), size: Number(x?.size ?? 0) }))
    .filter((x) => x.name);

  if (direccionEntrega && String(direccionEntrega).trim()) {
    return { files: f, meta: { direccionEntrega: String(direccionEntrega).trim() } } as Prisma.InputJsonValue;
  }
  return f as Prisma.InputJsonValue;
}

function unpackAdjuntos(adjuntosJson: any): { files: any[]; direccionEntrega?: string } {
  if (Array.isArray(adjuntosJson)) return { files: adjuntosJson };
  const o = asObj(adjuntosJson);
  const files = Array.isArray(o.files) ? o.files : [];
  const dir = o?.meta?.direccionEntrega ? String(o.meta.direccionEntrega) : undefined;
  return { files, direccionEntrega: dir };
}

async function nextComprobante() {
  const year = new Date().getFullYear();
  const prefix = `EN-${year}-`;
  const last = await prisma.entrega.findFirst({
    where: { comprobante: { startsWith: prefix } },
    orderBy: { comprobante: "desc" },
    select: { comprobante: true },
  });
  const lastNum = last?.comprobante?.slice(prefix.length) ?? "0000";
  const n = Number(lastNum);
  const next = Number.isFinite(n) ? n + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function splitNombre(full: string) {
  const parts = String(full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return { nombres: parts.slice(0, -1).join(" "), apellidos: parts.slice(-1).join(" ") };
  return { nombres: parts[0] ?? full ?? "", apellidos: "N/A" };
}

async function resolveBeneficiario(body: any): Promise<{ id: number | null; doc?: string; nombre?: string; direccion?: string }> {
  const bid = toInt(body?.beneficiarioId ?? body?.beneficiario_id);
  if (bid) {
    const b = await prisma.beneficiario.findUnique({
      where: { id: bid },
      select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true },
    });
    if (b) {
      return { id: b.id, doc: b.doc, nombre: `${b.nombres} ${b.apellidos}`.trim(), direccion: b.direccion ?? undefined };
    }
  }

  const benef = asObj(body?.beneficiario);
  const doc = String(benef?.doc ?? body?.doc ?? "").trim();
  if (!doc) return { id: null };

  const found = await prisma.beneficiario.findUnique({
    where: { doc },
    select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true },
  });

  if (found) {
    return { id: found.id, doc: found.doc, nombre: `${found.nombres} ${found.apellidos}`.trim(), direccion: found.direccion ?? undefined };
  }

  const tipoDoc = (benef?.tipo_doc ?? body?.tipo_doc ?? "CC") as TipoDocumento;
  const nombreFull = String(benef?.nombre ?? body?.nombre ?? "").trim();
  const { nombres, apellidos } = splitNombre(nombreFull || doc);
  const direccion = String(body?.direccion ?? "").trim() || undefined;

  const created = await prisma.beneficiario.create({
    data: {
      tipoDoc,
      doc,
      nombres: upper(nombres),
      apellidos: upper(apellidos),
      direccion: direccion ? upper(direccion) : undefined,
      activo: true,
    },
    select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true },
  });

  return { id: created.id, doc: created.doc, nombre: `${created.nombres} ${created.apellidos}`.trim(), direccion: created.direccion ?? undefined };
}

function toUi(row: any) {
  const b = row.beneficiario
    ? {
        doc: row.beneficiario.doc,
        nombre: `${row.beneficiario.nombres} ${row.beneficiario.apellidos}`.trim(),
        direccion: row.beneficiario.direccion ?? undefined,
      }
    : { doc: "", nombre: "" };

  const unpack = unpackAdjuntos(row.adjuntos);

  const responsableNombre =
    row.responsableUser?.nombre?.trim() ||
    row.responsableUser?.email?.trim() ||
    row.responsable ||
    "";

  return {
    id: row.id,
    comprobante: row.comprobante,
    fecha: toISO(row.fecha),
    beneficiario: { doc: b.doc, nombre: b.nombre },
    direccion: unpack.direccionEntrega ?? b.direccion ?? undefined,

    responsableUserId: row.responsableUserId ?? null,
    responsable: responsableNombre,

    estado: estadoToUi[row.estado] ?? "Pendiente",

    // ✅ devolver kitId también (para que el select quede seleccionado)
    kitId: row.kitId ?? null,

    kit: row.kit ?? "",
    items: asArr(row.items),
    observaciones: row.observaciones ?? "",
    adjuntos: unpack.files,
  };
}

/* =================== GET /api/entregas =================== */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const estado = (searchParams.get("estado") ?? "").trim();
  const from = (searchParams.get("from") ?? "").trim();
  const to = (searchParams.get("to") ?? "").trim();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? 50)));
  const skip = (page - 1) * pageSize;

  const where: Prisma.EntregaWhereInput = {};

  const estDb = estadoToDb[estado];
  if (estDb) where.estado = estDb;

  if (from || to) {
    where.fecha = {};
    if (from) (where.fecha as any).gte = new Date(from + "T00:00:00");
    if (to) (where.fecha as any).lte = new Date(to + "T23:59:59.999");
  }

  if (q) {
    where.OR = [
      { comprobante: { contains: q, mode: "insensitive" } },
      { responsable: { contains: q, mode: "insensitive" } },
      { kit: { contains: q, mode: "insensitive" } },
      { beneficiario: { is: { doc: { contains: q, mode: "insensitive" } } } },
      { beneficiario: { is: { nombres: { contains: q, mode: "insensitive" } } } },
      { beneficiario: { is: { apellidos: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.entrega.count({ where }),
    prisma.entrega.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { comprobante: "desc" }],
      include: {
        beneficiario: { select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true } },
        responsableUser: { select: { id: true, nombre: true, email: true } },
      },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json(
    { total, page, pageSize, items: items.map(toUi) },
    { headers: { "cache-control": "no-store" } }
  );
}

/* =================== POST /api/entregas =================== */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const comprobante = String(body?.comprobante ?? "").trim() || (await nextComprobante());
    const fecha = toDateOrNull(body?.fecha) ?? new Date();

    // ✅ responsable desde userId
    const responsableUserId = toInt(body?.responsableUserId);
    if (!responsableUserId) {
      return NextResponse.json({ error: "responsableUserId es requerido." }, { status: 400 });
    }

    const responsableUser = await prisma.user.findUnique({
      where: { id: responsableUserId },
      select: { id: true, nombre: true, email: true, activo: true },
    });

    if (!responsableUser) {
      return NextResponse.json({ error: "Responsable no existe." }, { status: 400 });
    }
    if (!responsableUser.activo) {
      return NextResponse.json({ error: "Responsable inactivo." }, { status: 403 });
    }

    const responsableNombre = (responsableUser.nombre ?? responsableUser.email ?? "").trim();
    if (!responsableNombre) {
      return NextResponse.json({ error: "El responsable no tiene nombre/email." }, { status: 400 });
    }

    const estDb = estadoToDb[String(body?.estado ?? "Pendiente")] ?? "PENDIENTE";

    // ✅ kitId (relación) + kit (snapshot)
    const kitId = toInt(body?.kitId);
    const kit = body?.kit ? upper(body.kit) : null;

    // ✅ AQUÍ QUITAMOS EL UUID: NO generamos id en servidor
    const items = asArr(body?.items)
      .map((it) => {
        const obj: any = {
          nombre: upper(it?.nombre ?? ""),
          unidad: upper(it?.unidad ?? "UND"),
          cantidad: Number(it?.cantidad ?? 0),
        };
        // si viene id desde el cliente, lo dejamos (pero NO lo generamos)
        if (it?.id) obj.id = String(it.id);
        return obj;
      })
      .filter((x) => x.nombre && x.cantidad > 0);

    if (!items.length) {
      return NextResponse.json({ error: "Debe incluir al menos 1 ítem con cantidad > 0." }, { status: 400 });
    }

    const b = await resolveBeneficiario(body);
    const beneficiarioId = b.id ?? null;

    const observaciones = body?.observaciones ? upper(body.observaciones) : null;
    const direccionEntrega = String(body?.direccion ?? "").trim() || undefined;
    const adjuntos = packAdjuntos(body?.adjuntos, direccionEntrega);

    const created = await prisma.entrega.create({
      data: {
        comprobante,
        fecha,

        responsableUserId: responsableUser.id,
        responsable: responsableNombre,

        estado: estDb,

        // ✅ guarda la relación (si tu schema ya tiene kitId)
        kitId: kitId ?? null,

        kit,
        items: items as any,
        observaciones,
        adjuntos: adjuntos as any,
        beneficiarioId,
      },
      include: {
        beneficiario: { select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true } },
        responsableUser: { select: { id: true, nombre: true, email: true } },
      },
    });

    return NextResponse.json(toUi(created), { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("POST /api/entregas error:", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una entrega con ese comprobante." }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message ?? "Error creando entrega" }, { status: 500 });
  }
}
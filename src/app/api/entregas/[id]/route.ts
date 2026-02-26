import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, EntregaEstado, TipoDocumento } from "@prisma/client";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ==== helpers (mismos criterios que route.ts) ==== */
const toInt = (v: any) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};
const asArr = (v: any) => (Array.isArray(v) ? v : []);
const asObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const toISO = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const toDateOrNull = (s: any) => {
  if (s === null || typeof s === "undefined" || String(s).trim() === "") return null;
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
};
const upper = (v: any) => {
  if (v === null || typeof v === "undefined") return v;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t ? t.toUpperCase() : "";
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

function packAdjuntos(files: any, direccionEntrega?: string) {
  const f = asArr(files)
    .map((x) => ({
      name: String(x?.name ?? x?.nombre ?? "").trim(),
      size: Number(x?.size ?? 0),
    }))
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

function splitNombre(full: string) {
  const parts = String(full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { nombres: parts.slice(0, -1).join(" "), apellidos: parts.slice(-1).join(" ") };
  }
  return { nombres: parts[0] ?? full ?? "", apellidos: "N/A" };
}

async function resolveBeneficiario(body: any): Promise<number | null> {
  const bid = toInt(body?.beneficiarioId ?? body?.beneficiario_id);
  if (bid) {
    const b = await prisma.beneficiario.findUnique({ where: { id: bid }, select: { id: true } });
    if (b) return b.id;
  }

  const benef = asObj(body?.beneficiario);
  const doc = String(benef?.doc ?? body?.doc ?? "").trim();
  if (!doc) return null;

  const found = await prisma.beneficiario.findUnique({ where: { doc }, select: { id: true } });
  if (found) return found.id;

  const tipoDoc = (benef?.tipo_doc ?? body?.tipo_doc ?? "CC") as TipoDocumento;
  const nombreFull = String(benef?.nombre ?? body?.nombre ?? "").trim();
  const { nombres, apellidos } = splitNombre(nombreFull || doc);

  const created = await prisma.beneficiario.create({
    data: {
      tipoDoc,
      doc,
      nombres: upper(nombres),
      apellidos: upper(apellidos),
      activo: true,
    },
    select: { id: true },
  });

  return created.id;
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

  return {
    id: row.id,
    comprobante: row.comprobante,
    fecha: toISO(row.fecha),
    beneficiario: { doc: b.doc, nombre: b.nombre },
    direccion: unpack.direccionEntrega ?? b.direccion ?? undefined,

    responsable: row.responsable ?? "",
    // ✅ si lo tienes en schema, útil para auditoría/UI
    responsableUserId: typeof row.responsableUserId === "number" ? row.responsableUserId : null,

    estado: estadoToUi[row.estado] ?? "Pendiente",
    kit: row.kit ?? "",
    items: asArr(row.items),
    observaciones: row.observaciones ?? "",
    adjuntos: unpack.files,
  };
}

async function getId(ctx: { params: any }) {
  const p = await ctx.params; // ✅ Next sync-dynamic safe
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

/* ================= GET /api/entregas/[id] ================= */
export async function GET(_req: NextRequest, ctx: { params: any }) {
  const id = await getId(ctx);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const item = await prisma.entrega.findUnique({
    where: { id },
    include: {
      beneficiario: { select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true } },
    },
  });

  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(toUi(item), { headers: { "cache-control": "no-store" } });
}

/* ================= PATCH /api/entregas/[id] ================= */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();

    // ✅ necesitamos estado actual para:
    // - no perder meta/adjuntos
    // - controlar responsableUserId (solo set si está null)
    const current = await prisma.entrega.findUnique({
      where: { id },
      select: { adjuntos: true, responsableUserId: true },
    });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const patch: Prisma.EntregaUpdateInput = {};

    if (typeof body.fecha !== "undefined") patch.fecha = toDateOrNull(body.fecha) ?? undefined;

    // ❌ IMPORTANTE: NO permitir actualizar responsable desde PATCH
    // if (typeof body.responsable !== "undefined") patch.responsable = upper(body.responsable) as any;

    // ✅ responsableUserId: solo permitir setear si está null (para que quede fijo)
    if (typeof body.responsableUserId !== "undefined") {
      const rid = toInt(body.responsableUserId);
      if (rid && !current.responsableUserId) {
        patch.responsableUserId = rid as any;
      }
    }

    if (typeof body.estado !== "undefined") {
      const est = estadoToDb[String(body.estado)] ?? undefined;
      if (est) patch.estado = est;
    }

    if (typeof body.kit !== "undefined") patch.kit = body.kit ? upper(body.kit) : null;

    if (typeof body.items !== "undefined") {
      const items = asArr(body.items)
        .map((it) => ({
          id: String(it?.id ?? crypto.randomUUID()),
          nombre: upper(it?.nombre ?? ""),
          unidad: upper(it?.unidad ?? "UND"),
          cantidad: Number(it?.cantidad ?? 0),
        }))
        .filter((x) => x.nombre && x.cantidad > 0);

      patch.items = items as any;
    }

    if (typeof body.observaciones !== "undefined") {
      patch.observaciones = body.observaciones ? upper(body.observaciones) : null;
    }

    // dirección se guarda en adjuntos.meta.direccionEntrega
    if (typeof body.adjuntos !== "undefined" || typeof body.direccion !== "undefined") {
      const unpack = unpackAdjuntos(current?.adjuntos);

      const files = typeof body.adjuntos !== "undefined" ? body.adjuntos : unpack.files;
      const dir =
        typeof body.direccion !== "undefined"
          ? String(body.direccion ?? "").trim()
          : unpack.direccionEntrega;

      patch.adjuntos = packAdjuntos(files, dir) as any;
    }

    // beneficiario
    if (typeof body.beneficiarioId !== "undefined" || typeof body.beneficiario !== "undefined") {
      const bid = await resolveBeneficiario(body);
      patch.beneficiario = bid ? ({ connect: { id: bid } } as any) : ({ disconnect: true } as any);
    }

    const updated = await prisma.entrega.update({
      where: { id },
      data: patch,
      include: {
        beneficiario: { select: { id: true, doc: true, nombres: true, apellidos: true, direccion: true } },
      },
    });

    return NextResponse.json(toUi(updated), { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("PATCH /api/entregas/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error actualizando" }, { status: 500 });
  }
}

/* ================= DELETE /api/entregas/[id] ================= */
export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.entrega.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/entregas/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error eliminando" }, { status: 500 });
  }
}
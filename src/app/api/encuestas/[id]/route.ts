import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Next 15: params puede ser Promise
async function getIntId(ctx: { params: any }) {
  const p = await ctx.params;
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

type Estado = "BORRADOR" | "ACTIVA" | "INACTIVA";
const ESTADOS: Estado[] = ["BORRADOR", "ACTIVA", "INACTIVA"];

const cleanStr = (v: any) => (v === null || typeof v === "undefined" ? "" : String(v).trim());
const normalizeEstado = (v: any): Estado => {
  const s = cleanStr(v).toUpperCase();
  return (ESTADOS.includes(s as Estado) ? (s as Estado) : "BORRADOR");
};

const makeQId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `q_${Math.random().toString(36).slice(2, 10)}`;

type TipoPregunta = "likert" | "si_no" | "opciones" | "texto";
const TIPOS: TipoPregunta[] = ["likert", "si_no", "opciones", "texto"];

function normalizePreguntas(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((p: any) => {
    const tipoRaw = cleanStr(p?.tipo);
    const tipo = (TIPOS.includes(tipoRaw as TipoPregunta) ? (tipoRaw as TipoPregunta) : "texto") as TipoPregunta;

    const opciones =
      tipo === "opciones"
        ? (Array.isArray(p?.opciones) ? p.opciones : []).map((x: any) => cleanStr(x)).filter(Boolean)
        : [];

    return {
      id: cleanStr(p?.id) || cleanStr(p?.tempId) || makeQId(),
      texto: cleanStr(p?.texto),
      tipo,
      opciones,
    };
  });
}

/* ===================== GET ===================== */
export async function GET(_req: Request, ctx: { params: any }) {
  try {
    const id = await getIntId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const encuesta = await prisma.encuesta.findUnique({
      where: { id },              // ✅ Int
      include: { respuestas: true },
    });

    if (!encuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(encuesta);
  } catch (e: any) {
    console.error("GET /api/encuestas/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

/* ===================== PATCH ===================== */
export async function PATCH(req: Request, ctx: { params: any }) {
  try {
    const id = await getIntId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const data = await req.json();

    const updated = await prisma.encuesta.update({
      where: { id }, // ✅ Int
      data: {
        titulo: cleanStr(data?.titulo) || "Encuesta",
        servicio: cleanStr(data?.servicio),
        estado: normalizeEstado(data?.estado),      // ✅ enum seguro
        descripcion: cleanStr(data?.descripcion) || null,
        preguntas: normalizePreguntas(data?.preguntas ?? []), // ✅ JSON limpio
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/encuestas/[id] error:", e);
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Error al actualizar encuesta" }, { status: 500 });
  }
}

/* ===================== DELETE ===================== */
export async function DELETE(_req: Request, ctx: { params: any }) {
  try {
    const id = await getIntId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.encuesta.delete({ where: { id } }); // ✅ Int
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/encuestas/[id] error:", e);
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Error al eliminar encuesta" }, { status: 500 });
  }
}
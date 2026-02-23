import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params; // ✅ soporta objeto o Promise
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

const asStr = (v: any) => (v === null || typeof v === "undefined" ? "" : String(v));
const clean = (v: any) => {
  const t = asStr(v).trim();
  return t === "" ? null : t; // 👈 null si vacío
};

export async function POST(req: Request, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // (Opcional) valida que exista la encuesta
    const enc = await prisma.encuesta.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!enc) {
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    // ✅ Acepta plano o respondente anidado
    const r = body?.respondente ?? {};

    const tipo_doc = clean(body?.tipo_doc ?? r?.tipo_doc); // string o null
    const documento = clean(body?.documento ?? r?.doc ?? r?.documento);
    const nombreDirecto = clean(body?.nombre ?? r?.nombre);

    // si no viene nombre pero sí nombres+apellidos
    const nombres = clean(r?.nombres);
    const apellidos = clean(r?.apellidos);
    const nombreArmado =
      !nombreDirecto && (nombres || apellidos)
        ? [nombres, apellidos].filter(Boolean).join(" ")
        : null;

    const nombre = nombreDirecto ?? nombreArmado;

    const valores = body?.valores ?? {};
    if (valores === null || typeof valores !== "object" || Array.isArray(valores)) {
      return NextResponse.json({ error: "Campo 'valores' inválido (debe ser objeto JSON)." }, { status: 400 });
    }

    const created = await prisma.respuesta.create({
      data: {
        encuestaId: id,
        tipo_doc,
        documento,
        nombre,
        valores, // Json
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("[API respuestas] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Estado = "BORRADOR" | "ACTIVA" | "INACTIVA";
const ESTADOS: Estado[] = ["BORRADOR", "ACTIVA", "INACTIVA"];

type TipoPregunta = "likert" | "si_no" | "opciones" | "texto";
const TIPOS: TipoPregunta[] = ["likert", "si_no", "opciones", "texto"];

const makeQId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `q_${Math.random().toString(36).slice(2, 10)}`;

const cleanStr = (v: any) => {
  if (v === null || typeof v === "undefined") return "";
  return String(v).trim();
};

function normalizeEstado(v: any): Estado {
  const s = cleanStr(v).toUpperCase();
  return (ESTADOS.includes(s as Estado) ? (s as Estado) : "BORRADOR");
}

function normalizePreguntas(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((p: any) => {
    const tipoRaw = cleanStr(p?.tipo);
    const tipo = (TIPOS.includes(tipoRaw as TipoPregunta)
      ? (tipoRaw as TipoPregunta)
      : "texto") as TipoPregunta;

    const opciones =
      tipo === "opciones"
        ? (Array.isArray(p?.opciones) ? p.opciones : [])
            .map((x: any) => cleanStr(x))
            .filter(Boolean)
        : [];

    return {
      id: cleanStr(p?.id) || cleanStr(p?.tempId) || makeQId(),
      texto: cleanStr(p?.texto),
      tipo,
      opciones,
    };
  });
}

/* ===================== GET: listar ===================== */
export async function GET() {
  const encuestas = await prisma.encuesta.findMany({
    orderBy: { creada: "desc" },
    include: { respuestas: true },
  });

  return NextResponse.json(encuestas, {
    headers: { "cache-control": "no-store" },
  });
}

/* ===================== POST: crear ===================== */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const titulo = cleanStr(data?.titulo) || "Nueva encuesta";
    const servicio = cleanStr(data?.servicio);
    const estado = normalizeEstado(data?.estado);
    const descripcion = cleanStr(data?.descripcion) || null;

    const preguntas = normalizePreguntas(data?.preguntas ?? []);

    const nueva = await prisma.encuesta.create({
      data: {
        titulo,
        servicio,
        estado, // ✅ enum correcto
        descripcion,
        preguntas, // ✅ Json
      },
      include: { respuestas: true }, // ✅ ya devuelve respuestas (vacío)
    });

    return NextResponse.json(nueva, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error: any) {
    console.error("Error al crear encuesta:", error);
    return NextResponse.json(
      { error: error?.message ?? "Error al crear encuesta" },
      { status: 500 }
    );
  }
}
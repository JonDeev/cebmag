import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Calcula los resultados de una encuesta:
 * - Promedios para tipo likert
 * - Conteo para tipo si_no y opciones
 * - Conteo de respuestas para tipo texto
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const encuesta = await prisma.encuesta.findUnique({
      where: { id: params.id },
      include: { respuestas: true },
    });

    if (!encuesta)
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });

    const preguntas = (encuesta.preguntas as any[]) || [];
    const respuestas = encuesta.respuestas || [];

    const resultados = preguntas.map((p) => {
      const valores = respuestas
        .map((r) => (r.valores as Record<string, any>)[p.id])
        .filter((v) => v !== undefined && v !== null);

      if (p.tipo === "likert") {
        const nums = valores.map((v) => Number(v)).filter((v) => !isNaN(v));
        const total = nums.length;
        const avg = total > 0 ? nums.reduce((a, b) => a + b, 0) / total : 0;
        const dist = Object.fromEntries(
          [1, 2, 3, 4, 5].map((n) => [n, nums.filter((x) => x === n).length])
        );
        return { pid: p.id, tipo: p.tipo, total, avg, dist };
      }

      if (p.tipo === "si_no") {
        const total = valores.length;
        const dist = { SI: 0, NO: 0 };
        valores.forEach((v) => {
          if (v === "SI") dist.SI++;
          else if (v === "NO") dist.NO++;
        });
        return { pid: p.id, tipo: p.tipo, total, dist };
      }

      if (p.tipo === "opciones") {
        const total = valores.length;
        const dist: Record<string, number> = {};
        valores.forEach((v: string) => {
          dist[v] = (dist[v] || 0) + 1;
        });
        return { pid: p.id, tipo: p.tipo, total, dist };
      }

      if (p.tipo === "texto") {
        return { pid: p.id, tipo: p.tipo, total: valores.length };
      }

      return { pid: p.id, tipo: p.tipo, total: 0 };
    });

    return NextResponse.json({
      id: encuesta.id,
      titulo: encuesta.titulo,
      totalRespuestas: respuestas.length,
      resultados,
    });
  } catch (error) {
    console.error("Error al obtener resultados:", error);
    return NextResponse.json(
      { error: "Error al generar resultados" },
      { status: 500 }
    );
  }
}

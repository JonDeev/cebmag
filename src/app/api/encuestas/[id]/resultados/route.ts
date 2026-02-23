import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params;
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

type TipoPregunta = "likert" | "si_no" | "opciones" | "texto";

function aggregate(preguntas: any[], respuestas: any[]) {
  const byPid: Record<string, { tipo: TipoPregunta; vals: any[] }> = {};

  for (const p of preguntas || []) {
    if (!p?.id) continue;
    byPid[p.id] = { tipo: p.tipo as TipoPregunta, vals: [] };
  }

  for (const r of respuestas || []) {
    const valores = (r?.valores && typeof r.valores === "object") ? r.valores : {};
    for (const [pid, v] of Object.entries(valores)) {
      if (!byPid[pid]) continue;
      byPid[pid].vals.push(v);
    }
  }

  const resultados = (preguntas || []).map((p: any) => {
    const pid = p.id;
    const tipo: TipoPregunta = p.tipo;
    const vals = byPid[pid]?.vals ?? [];
    const total = vals.length;

    if (tipo === "likert") {
      const nums = vals.map((x) => Number(x)).filter((n) => Number.isFinite(n));
      const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      return { pid, tipo, avg, total: nums.length };
    }

    if (tipo === "si_no") {
      const dist = { SI: 0, NO: 0 } as Record<string, number>;
      for (const v of vals) {
        const s = String(v).toUpperCase();
        if (s === "SI") dist.SI++;
        else if (s === "NO") dist.NO++;
      }
      return { pid, tipo, dist, total };
    }

    if (tipo === "opciones") {
      const dist: Record<string, number> = {};
      for (const v of vals) {
        const s = String(v);
        dist[s] = (dist[s] ?? 0) + 1;
      }
      return { pid, tipo, dist, total };
    }

    // texto
    return { pid, tipo, total };
  });

  return resultados;
}

export async function GET(_req: Request, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const encuesta = await prisma.encuesta.findUnique({
      where: { id },
      include: { respuestas: true },
    });

    if (!encuesta) {
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    const resultados = aggregate(encuesta.preguntas as any[], encuesta.respuestas as any[]);

    // ✅ lo que tu front espera: res.resultados
    return NextResponse.json(
      {
        encuesta: {
          id: encuesta.id,
          titulo: encuesta.titulo,
          servicio: encuesta.servicio,
          estado: encuesta.estado,
          descripcion: encuesta.descripcion,
          creada: encuesta.creada,
          preguntas: encuesta.preguntas,
        },
        resultados,
        totalRespuestas: encuesta.respuestas.length,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Error al obtener resultados:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
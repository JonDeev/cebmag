import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params; // ✅ soporta objeto o Promise
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function toRoleDto(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    permissions: r.permissions ?? null,
    usersCount: typeof r._count?.users === "number" ? r._count.users : 0,
  };
}

const patchRoleBody = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  permissions: z.any().optional(), // Json libre
});

/* ===================== GET /api/roles/[id] ===================== */
export async function GET(_req: NextRequest, ctx: { params: any }) {
  const id = await getId(ctx);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } }, // users = UserRole[]
  });

  if (!role) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(toRoleDto(role), {
    headers: { "cache-control": "no-store" },
  });
}

/* ===================== PATCH /api/roles/[id] ===================== */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const raw = await req.json();
    const data = patchRoleBody.parse(raw);

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(typeof data.name !== "undefined" ? { name: data.name } : {}),
        ...(typeof data.description !== "undefined"
          ? { description: data.description?.trim() || null }
          : {}),
        ...(typeof data.permissions !== "undefined"
          ? { permissions: data.permissions as any }
          : {}),
      },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json(toRoleDto(updated), {
      headers: { "cache-control": "no-store" },
    });
  } catch (e: any) {
    console.error("PATCH /api/roles/[id] error:", e);

    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un rol con ese nombre" },
        { status: 409 }
      );
    }
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: e?.message ?? "Error actualizando rol" },
      { status: 500 }
    );
  }
}

/* ===================== DELETE /api/roles/[id] ===================== */
/**
 * Por defecto bloquea si hay usuarios asignados.
 * Forzar: DELETE /api/roles/3?force=1
 */
export async function DELETE(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const usersCount = role._count?.users ?? 0;
    if (usersCount > 0 && !force) {
      return NextResponse.json(
        { error: "Este rol está asignado a usuarios. Quita asignaciones o usa ?force=1." },
        { status: 409 }
      );
    }

    await prisma.role.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("DELETE /api/roles/[id] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Error eliminando rol" },
      { status: 500 }
    );
  }
}
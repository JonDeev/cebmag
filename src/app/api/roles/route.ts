// app/api/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createRoleBody = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  permissions: z.any().optional(),
});

function toRoleDto(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    permissions: r.permissions ?? null,
    usersCount: typeof r._count?.users === "number" ? r._count.users : 0,
    createdAt: r.createdAt ?? null,
    updatedAt: r.updatedAt ?? null,
  };
}

/* ===================== GET /api/roles ===================== */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.role.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } }, // ✅ esto es lo que faltaba
  });

  return NextResponse.json(
    { items: items.map(toRoleDto) },
    { headers: { "cache-control": "no-store" } }
  );
}

/* ===================== POST /api/roles ===================== */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const data = createRoleBody.parse(raw);

    const created = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description?.trim() || null,
        permissions: typeof data.permissions === "undefined" ? null : data.permissions,
      },
      include: { _count: { select: { users: true } } }, // ✅ para que devuelva usersCount=0
    });

    return NextResponse.json(toRoleDto(created), { status: 201 });
  } catch (e: any) {
    console.error("POST /api/roles error:", e);

    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 409 });
    }
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? "Error creando rol" }, { status: 500 });
  }
}
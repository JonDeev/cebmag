import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params;
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function toUserDto(u: any) {
  const primary = u.roles?.[0]?.role ?? null;
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre ?? null,
    activo: !!u.activo,

    roles: (u.roles ?? []).map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
    })),

    roleId: primary?.id ?? null,
    roleName: primary?.name ?? null,
    rol: primary?.name ?? "Consulta",
    estado: u.activo ? "Activo" : "Inactivo",

    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const patchUserBody = z
  .object({
    nombre: z.string().trim().optional(),
    activo: z.boolean().optional(),

    // ✅ 1 rol
    roleId: z.number().int().positive().optional(),

    // ✅ compat: roleIds máximo 1
    roleIds: z.array(z.number().int().positive()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.roleId && val.roleIds?.length) {
      ctx.addIssue({
        code: "custom",
        message: "Envía solo roleId (o roleIds, pero no ambos).",
        path: ["roleIds"],
      });
    }
    if (val.roleIds && val.roleIds.length > 1) {
      ctx.addIssue({
        code: "custom",
        message: "Solo se permite 1 rol por usuario.",
        path: ["roleIds"],
      });
    }
  });

function resolveRoleId(data: { roleId?: number; roleIds?: number[] }) {
  if (data.roleId) return data.roleId;
  if (data.roleIds?.length) return data.roleIds[0];
  return null;
}

/* ===================== GET /api/users/[id] ===================== */
export async function GET(_req: NextRequest, ctx: { params: any }) {
  const id = await getId(ctx);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: { include: { role: true }, orderBy: { roleId: "asc" } },
    },
  });

  if (!u) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(toUserDto(u), { headers: { "cache-control": "no-store" } });
}

/* ===================== PATCH /api/users/[id] ===================== */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const raw = await req.json();
    const data = patchUserBody.parse(raw);

    const roleId = resolveRoleId(data);

    if (roleId) {
      const exists = await prisma.role.findUnique({ where: { id: roleId } });
      if (!exists) {
        return NextResponse.json({ error: "El rol enviado no existe" }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // campos simples
      await tx.user.update({
        where: { id },
        data: {
          ...(typeof data.nombre !== "undefined" ? { nombre: data.nombre || null } : {}),
          ...(typeof data.activo !== "undefined" ? { activo: data.activo } : {}),
        },
      });

      // ✅ reemplazo de rol si viene roleId/roleIds
      if (typeof data.roleId !== "undefined" || typeof data.roleIds !== "undefined") {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleId) {
          await tx.userRole.create({ data: { userId: id, roleId } });
        }
      }

      return tx.user.findUnique({
        where: { id },
        include: { roles: { include: { role: true }, orderBy: { roleId: "asc" } } },
      });
    });

    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(toUserDto(updated));
  } catch (e: any) {
    console.error("PATCH /api/users/[id] error:", e);

    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }

    return NextResponse.json({ error: e?.message ?? "Error actualizando" }, { status: 500 });
  }
}

/* ===================== DELETE /api/users/[id] ===================== */
export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/users/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error eliminando" }, { status: 500 });
  }
}
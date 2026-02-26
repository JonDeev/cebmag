import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===================== helpers ===================== */
async function getId(ctx: { params: any }) {
  const p = await ctx.params; // soporta objeto o Promise
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

const normUsuario = (v: string) => v.trim().toLowerCase(); // ✅ recomendado (evita Admin/admin)

/** DTO uniforme para tu UI */
function toUserDto(u: any) {
  const primary = u.roles?.[0]?.role ?? null;

  return {
    id: u.id,
    usuario: u.usuario, // ✅ nuevo username
    email: u.email,
    nombre: u.nombre ?? null,
    activo: !!u.activo,

    roles: (u.roles ?? []).map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
    })),

    // 1 rol (comodidad UI)
    roleId: primary?.id ?? null,
    roleName: primary?.name ?? null,
    rol: primary?.name ?? "Consulta",
    estado: u.activo ? "Activo" : "Inactivo",

    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/* ===================== Zod ===================== */
/** null/"" -> undefined (no tocar) */
const optString = (min = 0) =>
  z.preprocess(
    (v) => (v === null || typeof v === "undefined" ? undefined : String(v)),
    min > 0 ? z.string().trim().min(min) : z.string().trim()
  ).optional();

/** roleId puede venir null */
const optRoleId = z.preprocess(
  (v) => (v === null || typeof v === "undefined" || v === "" ? undefined : v),
  z.number().int().positive()
).optional();

const patchUserBody = z
  .object({
    // ✅ nuevo: usuario
    usuario: optString(3), // si viene, se actualiza (mín 3)

    // nombre puede venir null; si viene "", lo dejamos como null al guardar
    nombre: z.preprocess(
      (v) => (v === null || typeof v === "undefined" ? undefined : String(v)),
      z.string().trim()
    ).optional(),

    activo: z.boolean().optional(),

    // ✅ 1 rol
    roleId: optRoleId,

    // ✅ compat: roleIds máximo 1
    roleIds: z.array(z.number().int().positive()).optional(),
  })
  .superRefine((val, ctx) => {
    if (typeof val.roleId !== "undefined" && val.roleIds?.length) {
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
  if (typeof data.roleId === "number") return data.roleId;
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

  return NextResponse.json(toUserDto(u), {
    headers: { "cache-control": "no-store" },
  });
}

/* ===================== PATCH /api/users/[id] ===================== */
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const raw = await req.json();
    const data = patchUserBody.parse(raw);

    const roleId = resolveRoleId(data);

    // validar rol si viene en request (roleId o roleIds)
    const roleTouched =
      typeof data.roleId !== "undefined" || typeof data.roleIds !== "undefined";

    if (roleTouched && roleId) {
      const exists = await prisma.role.findUnique({ where: { id: roleId } });
      if (!exists) {
        return NextResponse.json(
          { error: "El rol enviado no existe" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // update campos simples
      await tx.user.update({
        where: { id },
        data: {
          ...(typeof data.usuario !== "undefined"
            ? { usuario: normUsuario(data.usuario) }
            : {}),
          ...(typeof data.nombre !== "undefined"
            ? { nombre: data.nombre.trim() ? data.nombre.trim() : null }
            : {}),
          ...(typeof data.activo !== "undefined" ? { activo: data.activo } : {}),
        },
      });

      // reemplazo de rol si lo tocaron
      if (roleTouched) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleId) {
          await tx.userRole.create({ data: { userId: id, roleId } });
        }
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          roles: { include: { role: true }, orderBy: { roleId: "asc" } },
        },
      });
    });

    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(toUserDto(updated));
  } catch (e: any) {
    console.error("PATCH /api/users/[id] error:", e);

    // unique (usuario/email)
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese usuario o email" },
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
      { error: e?.message ?? "Error actualizando" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: e?.message ?? "Error eliminando" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===================== helpers ===================== */
function hashPassword(plain: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function toUserDto(u: any) {
  const primary = u.roles?.[0]?.role ?? null;
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre ?? null,
    activo: !!u.activo,

    // ✅ compat: seguimos retornando roles[]
    roles: (u.roles ?? []).map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
    })),

    // ✅ cómodo para UI de “1 rol”
    roleId: primary?.id ?? null,
    roleName: primary?.name ?? null,

    // ✅ cómodo para tu TSX (rol/estado)
    rol: primary?.name ?? "Consulta",
    estado: u.activo ? "Activo" : "Inactivo",

    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const createUserBody = z
  .object({
    email: z.string().email(),
    password: z.string().min(6, "Password mínimo 6 caracteres"),
    nombre: z.string().trim().optional(),
    activo: z.boolean().optional(),

    // ✅ nuevo: 1 rol
    roleId: z.number().int().positive().optional(),

    // ✅ compat: si te llega roleIds, lo aceptamos pero máximo 1
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

async function resolveRoleId(input: { roleId?: number; roleIds?: number[] }) {
  if (input.roleId) return input.roleId;
  if (input.roleIds?.length) return input.roleIds[0];

  // ✅ opcional: si existe rol "Consulta", úsalo como default
  const consulta = await prisma.role.findUnique({ where: { name: "Consulta" } });
  return consulta?.id ?? null;
}

/* ===================== GET /api/users ===================== */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { nombre: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.user.findMany({
    where,
    orderBy: { id: "desc" },
    include: {
      roles: {
        include: { role: true },
        orderBy: { roleId: "asc" }, // ✅ consistente (1 rol => [0])
      },
    },
  });

  return NextResponse.json(
    { items: items.map(toUserDto) },
    { headers: { "cache-control": "no-store" } }
  );
}

/* ===================== POST /api/users ===================== */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const data = createUserBody.parse(raw);

    const roleId = await resolveRoleId({ roleId: data.roleId, roleIds: data.roleIds });

    // validar rol si viene (o si encontramos "Consulta")
    if (roleId) {
      const exists = await prisma.role.findUnique({ where: { id: roleId } });
      if (!exists) {
        return NextResponse.json({ error: "El rol enviado no existe" }, { status: 400 });
      }
    }

    const created = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashPassword(data.password),
        nombre: data.nombre?.trim() || null,
        activo: typeof data.activo === "boolean" ? data.activo : true,

        // ✅ 1 rol (si hay)
        roles: roleId ? { create: { roleId } } : undefined,
      },
      include: {
        roles: {
          include: { role: true },
          orderBy: { roleId: "asc" },
        },
      },
    });

    return NextResponse.json(toUserDto(created), { status: 201 });
  } catch (e: any) {
    console.error("POST /api/users error:", e);

    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando usuario" }, { status: 500 });
  }
}
// src/app/api/users/route.ts
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
  // guardamos: scrypt$<saltHex>$<hashHex>
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function toUserDto(u: any) {
  const primary = u.roles?.[0]?.role ?? null;
  return {
    id: u.id,
    usuario: u.usuario, // ✅ username
    email: u.email,
    nombre: u.nombre ?? null,
    activo: !!u.activo,

    // roles[]
    roles: (u.roles ?? []).map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
    })),

    // 1 rol (UI)
    roleId: primary?.id ?? null,
    roleName: primary?.name ?? null,

    // compat TSX (rol/estado)
    rol: primary?.name ?? "Consulta",
    estado: u.activo ? "Activo" : "Inactivo",

    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const createUserBody = z
  .object({
    usuario: z.string().trim().min(3, "Usuario mínimo 3 caracteres").max(50),
    email: z.string().email(),
    password: z.string().min(6, "Password mínimo 6 caracteres"),

    // ⚠️ allow null/undefined desde UI
    nombre: z.string().trim().min(1).optional().nullable(),

    activo: z.boolean().optional(),

    // 1 rol
    roleId: z.number().int().positive().optional().nullable(),

    // compat: roleIds (máximo 1)
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

async function resolveRoleId(input: { roleId?: number | null; roleIds?: number[] }) {
  if (typeof input.roleId === "number") return input.roleId;
  if (input.roleIds?.length) return input.roleIds[0];

  // opcional: default "Consulta"
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
      { usuario: { contains: q, mode: "insensitive" } }, // ✅ buscar por username
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
        orderBy: { roleId: "asc" }, // consistente (1 rol => [0])
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

    const roleId = await resolveRoleId({ roleId: data.roleId ?? null, roleIds: data.roleIds });

    // validar rol si viene
    if (roleId) {
      const exists = await prisma.role.findUnique({ where: { id: roleId } });
      if (!exists) {
        return NextResponse.json({ error: "El rol enviado no existe" }, { status: 400 });
      }
    }

    const created = await prisma.user.create({
      data: {
        usuario: data.usuario.trim(), // ✅
        email: data.email.toLowerCase().trim(),
        password: hashPassword(data.password),
        nombre: (data.nombre ?? "").trim() || null,
        activo: typeof data.activo === "boolean" ? data.activo : true,

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

    // ⚠️ Prisma unique
    if (e?.code === "P2002") {
      // puede fallar por usuario o email; devolvemos genérico
      return NextResponse.json({ error: "Ya existe un usuario con ese usuario o email" }, { status: 409 });
    }

    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando usuario" }, { status: 500 });
  }
}
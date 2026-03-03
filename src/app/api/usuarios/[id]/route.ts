// src/app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getId(ctx: { params: any }) {
  const p = await ctx.params; // soporta Promise u objeto
  const raw = String(p?.id ?? "").trim();
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function clean(s: any) {
  return String(s ?? "").trim();
}
function lowerEmail(s: any) {
  return clean(s).toLowerCase();
}
function toBoolActivo(estado: any) {
  const v = clean(estado).toLowerCase();
  if (!v) return undefined;
  return v === "activo" || v === "true" || v === "1" || v === "si";
}
function toInt(v: any) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}
function pickRolName(val: any) {
  const r = clean(val);
  return r || undefined;
}

async function ensureRoleTx(tx: any, name: string) {
  const role = await tx.role.upsert({
    where: { name },
    update: {},
    create: { name },
    select: { id: true, name: true },
  });
  return role;
}

function toUi(u: any) {
  const roles = (u?.roles ?? [])
    .map((ur: any) => ur?.role)
    .filter(Boolean)
    .map((r: any) => ({ id: r.id, name: r.name }));

  const roleName = roles?.[0]?.name ?? "Consulta";

  return {
    id: u.id,
    usuario: u.usuario ?? "",      // ✅ para tu UI
    nombre: u.nombre ?? "",
    email: u.email ?? "",
    activo: !!u.activo,            // ✅ boolean para tu UI
    roles,                         // ✅ array para tu UI

    // compat/legacy por si alguna pantalla lo usa
    rol: roleName,
    estado: u.activo ? "Activo" : "Inactivo",

    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function GET(_req: NextRequest, ctx: { params: any }) {
  const id = await getId(ctx);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const row = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });

  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(toUi(row), { headers: { "cache-control": "no-store" } });
}

// PATCH /api/usuarios/:id
// ✅ Soporta:
// - moderno: { usuario?, nombre?, email?, activo?, roleIds?: number[], password? }
// - legacy:  { rol?, estado? }
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();

    const dataUser: any = {};

    // ✅ usuario (moderno)
    if ("usuario" in body) {
      const usuario = clean(body.usuario);
      if (!usuario) return NextResponse.json({ error: "Usuario requerido" }, { status: 400 });
      if (usuario.length < 3) return NextResponse.json({ error: "Usuario mínimo 3 caracteres" }, { status: 400 });
      dataUser.usuario = usuario;
    }

    // nombre
    if ("nombre" in body) dataUser.nombre = clean(body.nombre) || null;

    // ✅ email editable
    if ("email" in body) {
      const email = lowerEmail(body.email);
      if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });
      dataUser.email = email;
    }

    // ✅ activo (moderno) o estado (legacy)
    if ("activo" in body) {
      dataUser.activo = !!body.activo;
    } else if ("estado" in body) {
      const activo = toBoolActivo(body.estado);
      if (typeof activo === "boolean") dataUser.activo = activo;
    }

    // password opcional
    if ("password" in body && clean(body.password)) {
      dataUser.password = await bcrypt.hash(clean(body.password), 10);
    }

    // roles: roleIds (moderno) o rol (legacy)
    let roleIds: number[] | null = null;

    if (Array.isArray(body.roleIds)) {
      const ids = body.roleIds.map(toInt).filter(Boolean) as number[];
      roleIds = ids;
    } else {
      const rolName = pickRolName(body.rol);
      if (rolName) roleIds = null; // lo resolvemos dentro del tx como 1 rol
    }

    const rolNameLegacy = pickRolName(body.rol);

    const updated = await prisma.$transaction(async (tx) => {
      // 1) actualizar usuario si hay data
      if (Object.keys(dataUser).length > 0) {
        await tx.user.update({
          where: { id },
          data: dataUser,
        });
      }

      // 2) roles (si vienen)
      if (Array.isArray(body.roleIds)) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if ((roleIds || []).length) {
          await tx.userRole.createMany({
            data: (roleIds || []).map((rid) => ({ userId: id, roleId: rid })),
            skipDuplicates: true,
          });
        }
      } else if (rolNameLegacy) {
        const role = await ensureRoleTx(tx, rolNameLegacy);
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({ data: { userId: id, roleId: role.id } });
      }

      const u2 = await tx.user.findUnique({
        where: { id },
        include: { roles: { include: { role: true } } },
      });

      if (!u2) throw new Error("No encontrado");
      return u2;
    });

    return NextResponse.json(toUi(updated), { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("PATCH /api/usuarios/[id] error:", e);

    if (e?.code === "P2002") {
      // puede ser email o usuario duplicado
      return NextResponse.json({ error: "Ya existe un usuario con ese email o usuario." }, { status: 409 });
    }

    return NextResponse.json(
      { error: e?.message ?? "Error actualizando usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("DELETE /api/usuarios/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error eliminando usuario" }, { status: 500 });
  }
}
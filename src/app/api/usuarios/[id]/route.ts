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
function toBoolActivo(v: any): boolean | undefined {
  if (typeof v === "boolean") return v;
  const s = clean(v).toLowerCase();
  if (!s) return undefined;
  return s === "activo" || s === "true" || s === "1" || s === "si";
}

function buildFullName(parts: {
  primerNombre?: any;
  segundoNombre?: any;
  primerApellido?: any;
  segundoApellido?: any;
}) {
  const p1 = clean(parts.primerNombre);
  const p2 = clean(parts.segundoNombre);
  const a1 = clean(parts.primerApellido);
  const a2 = clean(parts.segundoApellido);
  const full = [p1, p2, a1, a2].filter(Boolean).join(" ").trim();
  return full || null;
}

function pickRoleIdFromBody(body: any): number | null {
  const arr = Array.isArray(body?.roleIds) ? body.roleIds : null;
  if (arr && arr.length) {
    const id = Number(arr[0]);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  const single = body?.roleId;
  if (single !== undefined && single !== null && String(single).trim() !== "") {
    const id = Number(single);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  return null;
}

function toUi(u: any) {
  const roles = Array.isArray(u?.roles)
    ? u.roles
        .map((ur: any) => ur?.role)
        .filter(Boolean)
        .map((r: any) => ({ id: r.id, name: r.name }))
    : [];

  return {
    id: u.id,
    usuario: u.usuario ?? "",
    email: u.email ?? "",
    nombre: u.nombre ?? "",

    primerNombre: u.primerNombre ?? null,
    segundoNombre: u.segundoNombre ?? null,
    primerApellido: u.primerApellido ?? null,
    segundoApellido: u.segundoApellido ?? null,

    activo: !!u.activo,

    // compatibilidad vieja
    estado: u.activo ? "Activo" : "Inactivo",
    rol: roles?.[0]?.name ?? "Consulta",

    roles,
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
// body soportado:
// - { usuario?, email?, activo?, estado?, password?,
//     nombre?, primerNombre?, segundoNombre?, primerApellido?, segundoApellido?,
//     roleIds?, roleId?, rol? }
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();

    const dataUser: any = {};

    // ✅ básicos
    if ("usuario" in body) dataUser.usuario = clean(body.usuario);
    if ("email" in body) dataUser.email = lowerEmail(body.email);

    if ("activo" in body || "estado" in body) {
      const activo = toBoolActivo(body.activo ?? body.estado);
      if (typeof activo === "boolean") dataUser.activo = activo;
    }

    if ("password" in body && clean(body.password)) {
      dataUser.password = await bcrypt.hash(clean(body.password), 10);
    }

    // ✅ nombres separados
    if ("primerNombre" in body) dataUser.primerNombre = clean(body.primerNombre) || null;
    if ("segundoNombre" in body) dataUser.segundoNombre = clean(body.segundoNombre) || null;
    if ("primerApellido" in body) dataUser.primerApellido = clean(body.primerApellido) || null;
    if ("segundoApellido" in body) dataUser.segundoApellido = clean(body.segundoApellido) || null;

    const touchingNameParts =
      "primerNombre" in body ||
      "segundoNombre" in body ||
      "primerApellido" in body ||
      "segundoApellido" in body;

    // ✅ si mandan nombre explícito, lo respetamos. Si no, recalculamos si tocaron partes.
    if ("nombre" in body) {
      dataUser.nombre = clean(body.nombre) || null;
    } else if (touchingNameParts) {
      const current = await prisma.user.findUnique({
        where: { id },
        select: { primerNombre: true, segundoNombre: true, primerApellido: true, segundoApellido: true },
      });

      const merged = {
        primerNombre: ("primerNombre" in body ? dataUser.primerNombre : current?.primerNombre) ?? null,
        segundoNombre: ("segundoNombre" in body ? dataUser.segundoNombre : current?.segundoNombre) ?? null,
        primerApellido: ("primerApellido" in body ? dataUser.primerApellido : current?.primerApellido) ?? null,
        segundoApellido: ("segundoApellido" in body ? dataUser.segundoApellido : current?.segundoApellido) ?? null,
      };

      dataUser.nombre = buildFullName(merged);
    }

    // ✅ rol (por id o por nombre)
    const roleIdFromBody = pickRoleIdFromBody(body);
    const rolName = clean(body.rol);

    const updated = await prisma.$transaction(async (tx) => {
      // 1) update usuario
      await tx.user.update({
        where: { id },
        data: dataUser,
      });

      // 2) si vienen roles, dejamos SOLO 1 rol (el primero)
      if (roleIdFromBody || rolName) {
        let roleIdToUse: number;

        if (roleIdFromBody) {
          roleIdToUse = roleIdFromBody;
        } else {
          const role = await tx.role.upsert({
            where: { name: rolName || "Consulta" },
            update: {},
            create: { name: rolName || "Consulta" },
            select: { id: true },
          });
          roleIdToUse = role.id;
        }

        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({ data: { userId: id, roleId: roleIdToUse } });
      }

      // 3) devolver usuario final
      const u2 = await tx.user.findUnique({
        where: { id },
        include: { roles: { include: { role: true } } },
      });

      return u2!;
    });

    return NextResponse.json(toUi(updated), { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("PATCH /api/usuarios/[id] error:", e);

    if (e?.code === "P2002") {
      const target = Array.isArray(e?.meta?.target) ? e.meta.target.join(", ") : "";
      if (String(target).includes("usuario")) {
        return NextResponse.json({ error: "Ese usuario ya existe." }, { status: 409 });
      }
      if (String(target).includes("email")) {
        return NextResponse.json({ error: "Ese email ya existe." }, { status: 409 });
      }
      return NextResponse.json({ error: "Ya existe un registro con ese dato único." }, { status: 409 });
    }

    return NextResponse.json({ error: e?.message ?? "Error actualizando usuario" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("DELETE /api/usuarios/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error eliminando usuario" }, { status: 400 });
  }
}
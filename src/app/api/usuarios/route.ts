// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s: any) {
  return String(s ?? "").trim();
}
function lowerEmail(s: any) {
  return clean(s).toLowerCase();
}
function toBoolActivo(v: any): boolean {
  // acepta boolean, "Activo"/"Inactivo", "true/false", "1/0", "si/no"
  if (typeof v === "boolean") return v;
  const s = clean(v).toLowerCase();
  if (!s) return true;
  return s === "activo" || s === "true" || s === "1" || s === "si";
}

function randPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
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

async function ensureRoleByName(name: string) {
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
    select: { id: true, name: true },
  });
  return role;
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

    // ✅ separados
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

// GET /api/usuarios?q=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = clean(searchParams.get("q")).toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? 50)));
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (q) {
    where.OR = [
      { usuario: { contains: q, mode: "insensitive" } },
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },

      // ✅ por campos separados también
      { primerNombre: { contains: q, mode: "insensitive" } },
      { segundoNombre: { contains: q, mode: "insensitive" } },
      { primerApellido: { contains: q, mode: "insensitive" } },
      { segundoApellido: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ activo: "desc" }, { createdAt: "desc" }],
      include: { roles: { include: { role: true } } },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json(
    { total, page, pageSize, items: items.map(toUi) },
    { headers: { "cache-control": "no-store" } }
  );
}

// POST /api/usuarios
// body soportado:
// - { usuario, email, password?, activo?, estado?, nombre?, primerNombre?, segundoNombre?, primerApellido?, segundoApellido?, roleIds?, roleId?, rol? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const usuario = clean(body.usuario);
    const email = lowerEmail(body.email);

    const primerNombre = clean(body.primerNombre);
    const segundoNombre = clean(body.segundoNombre);
    const primerApellido = clean(body.primerApellido);
    const segundoApellido = clean(body.segundoApellido);

    const nombreCompleto =
      clean(body.nombre) ||
      buildFullName({ primerNombre, segundoNombre, primerApellido, segundoApellido });

    const activo = toBoolActivo(body.activo ?? body.estado);

    if (!usuario) return NextResponse.json({ error: "Usuario requerido" }, { status: 400 });
    if (usuario.length < 3) return NextResponse.json({ error: "Usuario mínimo 3 caracteres" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    // password temporal si no mandan
    const tempPassword = clean(body.password) || randPassword(12);
    const hash = await bcrypt.hash(tempPassword, 10);

    // rol: roleIds/roleId > rol(string) > Consulta
    const roleIdFromBody = pickRoleIdFromBody(body);
    const rolName = clean(body.rol) || "Consulta";

    const created = await prisma.$transaction(async (tx) => {
      let roleIdToUse: number;

      if (roleIdFromBody) {
        roleIdToUse = roleIdFromBody;
      } else {
        const role = await tx.role.upsert({
          where: { name: rolName },
          update: {},
          create: { name: rolName },
          select: { id: true },
        });
        roleIdToUse = role.id;
      }

      const u = await tx.user.create({
        data: {
          usuario,
          email,
          password: hash,
          activo,

          nombre: nombreCompleto,
          primerNombre: primerNombre || null,
          segundoNombre: segundoNombre || null,
          primerApellido: primerApellido || null,
          segundoApellido: segundoApellido || null,

          roles: { create: [{ roleId: roleIdToUse }] },
        },
        include: { roles: { include: { role: true } } },
      });

      return u;
    });

    const resp: any = toUi(created);

    // devolvemos tempPassword SOLO si no lo mandaron
    if (!clean(body.password)) resp.tempPassword = tempPassword;

    return NextResponse.json(resp, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("POST /api/usuarios error:", e);

    if (e?.code === "P2002") {
      // puede ser usuario o email
      const target = Array.isArray(e?.meta?.target) ? e.meta.target.join(", ") : "";
      if (String(target).includes("usuario")) {
        return NextResponse.json({ error: "Ese usuario ya existe." }, { status: 409 });
      }
      if (String(target).includes("email")) {
        return NextResponse.json({ error: "Ese email ya existe." }, { status: 409 });
      }
      return NextResponse.json({ error: "Ya existe un registro con ese dato único." }, { status: 409 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando usuario" }, { status: 500 });
  }
}
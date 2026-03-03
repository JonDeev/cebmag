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
function toBoolActivo(v: any) {
  const x = clean(v).toLowerCase();
  if (!x) return true;
  return x === "activo" || x === "true" || x === "1" || x === "si";
}
function toInt(v: any) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function randPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function ensureRole(name: string) {
  const role = await prisma.role.upsert({
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
    usuario: u.usuario ?? "", // ✅ importante para tu UI
    nombre: u.nombre ?? "",
    email: u.email ?? "",
    activo: !!u.activo, // ✅ boolean para tu UI
    roles,              // ✅ array para tu UI

    // compat/legacy (por si alguna pantalla lo usa)
    rol: roleName,
    estado: u.activo ? "Activo" : "Inactivo",

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
      { usuario: { contains: q, mode: "insensitive" } }, // ✅
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
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
// - nuevo UI: { usuario, nombre?, email, activo?, roleIds?: number[], password? }
// - legacy:   { nombre, email, rol, estado, password? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const usuario = clean(body.usuario);
    const email = lowerEmail(body.email);
    const nombre = clean(body.nombre);

    const activo = typeof body.activo !== "undefined" ? !!body.activo : toBoolActivo(body.estado);

    if (!usuario) return NextResponse.json({ error: "Usuario requerido" }, { status: 400 });
    if (usuario.length < 3) return NextResponse.json({ error: "Usuario mínimo 3 caracteres" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    // password
    const tempPassword = clean(body.password) || randPassword(12);
    const hash = await bcrypt.hash(tempPassword, 10);

    // roles
    let roleIds: number[] = [];
    if (Array.isArray(body.roleIds)) {
      roleIds = body.roleIds.map(toInt).filter(Boolean) as number[];
    } else if (clean(body.rol)) {
      const role = await ensureRole(clean(body.rol) || "Consulta");
      roleIds = [role.id];
    } else {
      const role = await ensureRole("Consulta");
      roleIds = [role.id];
    }

    const created = await prisma.user.create({
      data: {
        usuario, // ✅
        email,
        nombre: nombre || null,
        activo,
        password: hash,
        roles: { create: roleIds.map((rid) => ({ roleId: rid })) },
      },
      include: { roles: { include: { role: true } } },
    });

    const resp: any = toUi(created);
    if (!clean(body.password)) resp.tempPassword = tempPassword;

    return NextResponse.json(resp, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("POST /api/usuarios error:", e);

    if (e?.code === "P2002") {
      // puede ser email o usuario duplicado
      return NextResponse.json({ error: "Ya existe un usuario con ese email o usuario." }, { status: 409 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando usuario" }, { status: 500 });
  }
}
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
function toBoolActivo(estado: any) {
  const v = clean(estado).toLowerCase();
  if (!v) return true;
  return v === "activo" || v === "true" || v === "1" || v === "si";
}

function pickRolName(val: any) {
  const r = clean(val);
  return r || "Consulta";
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
  const roleName = u?.roles?.[0]?.role?.name ?? "Consulta";
  return {
    id: u.id,
    nombre: u.nombre ?? "",
    email: u.email,
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
// body: { nombre, email, rol, estado, password? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = lowerEmail(body.email);
    const nombre = clean(body.nombre);
    const rol = pickRolName(body.rol);
    const activo = toBoolActivo(body.estado);

    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    // Si no mandan password, generamos uno temporal y lo devolvemos (solo en respuesta)
    const tempPassword = clean(body.password) || randPassword(12);
    const hash = await bcrypt.hash(tempPassword, 10);

    const role = await ensureRole(rol);

    const created = await prisma.user.create({
      data: {
        email,
        nombre: nombre || null,
        activo,
        password: hash,
        roles: { create: [{ roleId: role.id }] },
      },
      include: { roles: { include: { role: true } } },
    });

    // devolvemos tempPassword SOLO si no lo mandaron
    const resp: any = toUi(created);
    if (!clean(body.password)) resp.tempPassword = tempPassword;

    return NextResponse.json(resp, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("POST /api/usuarios error:", e);

    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ese email ya existe." }, { status: 409 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando usuario" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
// si ya tienes signJwt en tu proyecto úsalo aquí:
import { signJwt } from "@/lib/auth"; // <-- ajusta a tu helper real

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

function verifyPassword(plain: string, stored: string) {
  const [algo, saltHex, hashHex] = String(stored || "").split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(plain, salt, expected.length);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const { usuario, password } = bodySchema.parse(raw);

    // ✅ si ya tienes campo `usuario` en DB, úsalo aquí:
    const u = await prisma.user.findUnique({
      where: { usuario: usuario.trim().toLowerCase() },
      include: { roles: { include: { role: true }, orderBy: { roleId: "asc" } } },
    });

    if (!u) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    if (!u.activo) return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });

    const ok = verifyPassword(password, u.password);
    if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    // ✅ genera token (ajusta payload a tu app)
    const token = await signJwt({
      sub: String(u.id),
      name: u.nombre ?? "",
      roles: (u.roles ?? []).map((ur) => ur.role.name),
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: u.id,
        usuario: u.usuario,
        nombre: u.nombre ?? null,
        activo: !!u.activo,
        roles: (u.roles ?? []).map((ur) => ({ id: ur.role.id, name: ur.role.name })),
      },
    });

    // ✅ cookie para middleware/guard
    res.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    console.error("POST /api/auth/login error:", e);
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
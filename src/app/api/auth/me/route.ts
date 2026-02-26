import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractPerms(permissions: any): string[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions.map(String);
  if (typeof permissions === "object") {
    const out: string[] = [];
    for (const [k, v] of Object.entries(permissions)) {
      if (v === true) out.push(k);
    }
    return out;
  }
  return [];
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth")?.value;
  if (!token) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true }, orderBy: { roleId: "asc" } } },
  });

  if (!u || !u.activo) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const permissions = (u.roles ?? []).flatMap((ur) => extractPerms(ur.role?.permissions));

  return NextResponse.json(
    {
      user: {
        id: u.id,
        usuario: u.usuario,
        email: u.email,
        nombre: u.nombre ?? null,
        activo: !!u.activo,
        roles: (u.roles ?? []).map((ur) => ({ id: ur.role.id, name: ur.role.name })),
        permissions,
      },
    },
    { headers: { "cache-control": "no-store" } }
  );
}
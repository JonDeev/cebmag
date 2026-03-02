// app/api/kits/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type JwtPayload = {
  sub: string;
  role?: string;
  name?: string;
  [key: string]: any;
};

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) return null;

  const payload = (await verifyJwt(token)) as JwtPayload | null;
  if (!payload?.sub) return null;

  const userId = Number(payload.sub);
  if (!userId || Number.isNaN(userId)) return null;

  return { userId, payload };
}

const KitItemInputSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(120),
  unidad: z.string().max(30).optional().nullable(),
  cantidad: z.coerce.number().int().min(1).default(1),
  opcional: z.coerce.boolean().default(false),
  orden: z.coerce.number().int().min(0).default(0),
});

const KitCreateSchema = z.object({
  nombre: z.string().min(2).max(120),
  descripcion: z.string().max(400).optional().nullable(),
  activo: z.coerce.boolean().optional().default(true),
  items: z.array(KitItemInputSchema).min(1, "Debe tener al menos 1 item"),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const onlyActive = url.searchParams.get("onlyActive"); // "1" | "true"
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (onlyActive === "1" || onlyActive === "true") where.activo = true;
  if (q) where.nombre = { contains: q, mode: "insensitive" };

  const kits = await prisma.kit.findMany({
    where,
    include: { items: { orderBy: { orden: "asc" } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(kits);
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const input = KitCreateSchema.parse(body);

    const kit = await prisma.kit.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
        activo: input.activo ?? true,
        items: {
          create: input.items.map((it) => ({
            nombre: it.nombre,
            unidad: it.unidad ?? null,
            cantidad: it.cantidad ?? 1,
            opcional: it.opcional ?? false,
            orden: it.orden ?? 0,
          })),
        },
      },
      include: { items: { orderBy: { orden: "asc" } } },
    });

    return NextResponse.json(kit, { status: 201 });
  } catch (err: any) {
    // Zod
    if (err?.name === "ZodError") {
      return NextResponse.json({ message: "Datos inválidos", errors: err.errors }, { status: 400 });
    }

    // Prisma unique
    if (err?.code === "P2002") {
      return NextResponse.json({ message: "Ya existe un kit con ese nombre" }, { status: 409 });
    }

    console.error("POST /api/kits error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
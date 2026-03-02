// app/api/kits/[id]/route.ts
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

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const KitItemInputSchema = z.object({
  nombre: z.string().min(1).max(120),
  unidad: z.string().max(30).optional().nullable(),
  cantidad: z.coerce.number().int().min(1).default(1),
  opcional: z.coerce.boolean().default(false),
  orden: z.coerce.number().int().min(0).default(0),
});

const KitUpdateSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  descripcion: z.string().max(400).optional().nullable(),
  activo: z.coerce.boolean().optional(),
  // si viene, REEMPLAZA items completos
  items: z.array(KitItemInputSchema).min(1).optional(),
});

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { id } = ParamsSchema.parse(ctx.params);

  const kit = await prisma.kit.findUnique({
    where: { id },
    include: { items: { orderBy: { orden: "asc" } } },
  });

  if (!kit) return NextResponse.json({ message: "Kit no encontrado" }, { status: 404 });

  return NextResponse.json(kit);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { id } = ParamsSchema.parse(ctx.params);

  try {
    const body = await req.json();
    const input = KitUpdateSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1) update kit fields
      const kit = await tx.kit.update({
        where: { id },
        data: {
          ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
          ...(input.descripcion !== undefined ? { descripcion: input.descripcion ?? null } : {}),
          ...(input.activo !== undefined ? { activo: input.activo } : {}),
        },
      });

      // 2) replace items (si vienen)
      if (input.items) {
        await tx.kitItem.deleteMany({ where: { kitId: id } });
        await tx.kitItem.createMany({
          data: input.items.map((it) => ({
            kitId: id,
            nombre: it.nombre,
            unidad: it.unidad ?? null,
            cantidad: it.cantidad ?? 1,
            opcional: it.opcional ?? false,
            orden: it.orden ?? 0,
          })),
        });
      }

      // 3) return kit + items
      const full = await tx.kit.findUnique({
        where: { id },
        include: { items: { orderBy: { orden: "asc" } } },
      });

      return full!;
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ message: "Datos inválidos", errors: err.errors }, { status: 400 });
    }

    if (err?.code === "P2002") {
      return NextResponse.json({ message: "Ya existe un kit con ese nombre" }, { status: 409 });
    }

    if (err?.code === "P2025") {
      return NextResponse.json({ message: "Kit no encontrado" }, { status: 404 });
    }

    console.error("PATCH /api/kits/[id] error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// DELETE = desactivar (soft delete)
export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { id } = ParamsSchema.parse(ctx.params);

  try {
    const kit = await prisma.kit.update({
      where: { id },
      data: { activo: false },
      include: { items: { orderBy: { orden: "asc" } } },
    });

    return NextResponse.json({ message: "Kit desactivado", kit });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ message: "Kit no encontrado" }, { status: 404 });
    }
    console.error("DELETE /api/kits/[id] error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
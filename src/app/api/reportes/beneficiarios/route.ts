import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcEdad, endOfDayUTC, split2, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const d1 = (url.searchParams.get("d1") ?? "").trim();
  const d2 = (url.searchParams.get("d2") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();

  const where: any = { AND: [] as any[] };

  if (d1) where.AND.push({ createdAt: { gte: startOfDayUTC(d1) } });
  if (d2) where.AND.push({ createdAt: { lte: endOfDayUTC(d2) } });

  if (q) {
    where.AND.push({
      OR: [
        { doc: { contains: q, mode: "insensitive" } },
        { nombres: { contains: q, mode: "insensitive" } },
        { apellidos: { contains: q, mode: "insensitive" } },
        { primerNombre: { contains: q, mode: "insensitive" } },
        { primerApellido: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
        { celular: { contains: q, mode: "insensitive" } },
        { eps: { contains: q, mode: "insensitive" } },
        { ciudad: { contains: q, mode: "insensitive" } },
        { departamento: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (!where.AND.length) delete where.AND;

  const items = await prisma.beneficiario.findMany({
    where,
    take: 500,
    orderBy: { id: "desc" },
    select: {
      tipoDoc: true,
      doc: true,

      primerNombre: true,
      segundoNombre: true,
      primerApellido: true,
      segundoApellido: true,

      nombres: true,
      apellidos: true,

      fechaNacimiento: true,
      sexo: true,

      celular: true,
      telefono: true,
      email: true,

      eps: true,
      rh: true,

      ciudad: true,
      departamento: true,

      activo: true,
      createdAt: true,
    },
  });

  const rows = items.map((b) => {
    const n = split2(b.nombres);
    const a = split2(b.apellidos);

    const primerNombre = b.primerNombre ?? n.a ?? "";
    const segundoNombre = b.segundoNombre ?? n.b ?? "";
    const primerApellido = b.primerApellido ?? a.a ?? "";
    const segundoApellido = b.segundoApellido ?? a.b ?? "";

    return {
      tipoDoc: String(b.tipoDoc ?? ""),
      doc: String(b.doc ?? ""),

      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,

      fechaNacimiento: toYMD(b.fechaNacimiento),
      edad: calcEdad(b.fechaNacimiento),
      sexo: b.sexo ? String(b.sexo) : "",

      celular: b.celular ?? "",
      telefono: b.telefono ?? "",
      email: b.email ?? "",

      eps: b.eps ?? "",
      rh: b.rh ? String(b.rh) : "",

      ciudad: b.ciudad ?? "",
      departamento: b.departamento ?? "",

      activo: b.activo ? "Sí" : "No",
      createdAt: toYMD(b.createdAt),
    };
  });

  return NextResponse.json({ items: rows });
}
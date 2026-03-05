import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcEdad, endOfDayUTC, split2, startOfDayUTC, toYMD } from "@/lib/reportes/serverUtils";
import { newWb, styleBody, styleHeader } from "@/lib/reportes/excel";

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

  const wb = newWb();
  const ws = wb.addWorksheet("Beneficiarios", { views: [{ state: "frozen", ySplit: 1 }] });

  // ✅ Usamos title para header manual, y NO usamos "header" en ws.columns
  const cols = [
    { title: "Tipo Doc", key: "tipoDoc", width: 10 },
    { title: "Documento", key: "doc", width: 16, numFmt: "@" },
    { title: "Primer Nombre", key: "primerNombre", width: 16 },
    { title: "Segundo Nombre", key: "segundoNombre", width: 16 },
    { title: "Primer Apellido", key: "primerApellido", width: 16 },
    { title: "Segundo Apellido", key: "segundoApellido", width: 16 },
    { title: "Fecha Nacimiento", key: "fechaNacimiento", width: 14 },
    { title: "Edad", key: "edad", width: 6 },
    { title: "Sexo", key: "sexo", width: 10 },
    { title: "Celular", key: "celular", width: 14, numFmt: "@" },
    { title: "Teléfono", key: "telefono", width: 14, numFmt: "@" },
    { title: "Email", key: "email", width: 26 },
    { title: "EPS", key: "eps", width: 18 },
    { title: "RH", key: "rh", width: 8 },
    { title: "Ciudad", key: "ciudad", width: 16 },
    { title: "Departamento", key: "departamento", width: 18 },
    { title: "Activo", key: "activo", width: 10 },
    { title: "Creado", key: "createdAt", width: 12 },
  ];

  // ✅ Columnas sin header (para que NO cree fila automática)
  ws.columns = cols.map((c) => ({
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  })) as any;

  // ✅ Header manual (solo una vez)
  ws.addRow(cols.map((c) => c.title));
  styleHeader(ws, 1, cols.length);

  for (const b of items) {
    const n = split2(b.nombres);
    const a = split2(b.apellidos);

    ws.addRow({
      tipoDoc: String(b.tipoDoc ?? ""),
      doc: String(b.doc ?? ""),
      primerNombre: b.primerNombre ?? n.a ?? "",
      segundoNombre: b.segundoNombre ?? n.b ?? "",
      primerApellido: b.primerApellido ?? a.a ?? "",
      segundoApellido: b.segundoApellido ?? a.b ?? "",
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
    });
  }

  ws.autoFilter = { from: "A1", to: ws.getCell(1, cols.length).address };
  styleBody(ws, 2);

  const buf = await wb.xlsx.writeBuffer();
  const file = Buffer.from(buf);
  const filename = `beneficiarios-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
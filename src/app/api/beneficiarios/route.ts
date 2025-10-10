import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TipoDocumento, Sexo, Zona, GrupoRH, DiscapacidadTipo, Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ==== helpers de mapeo desde la UI ==== */
const mapSexo = (s?: string | null): Sexo | null => {
  if (!s) return null;
  const t = s.toLowerCase();
  if (t.startsWith('fem')) return Sexo.FEMENINO;
  if (t.startsWith('mas')) return Sexo.MASCULINO;
  return Sexo.OTRO;
};

const mapZona = (z?: string | null): Zona | null => {
  if (!z) return null;
  return z.toLowerCase().startsWith('u') ? Zona.URBANA : Zona.RURAL;
};

const mapRH = (rh?: string | null): GrupoRH | null => {
  if (!rh) return null;
  const v = rh.toUpperCase().replace(/\s+/g, '');
  const map: Record<string, GrupoRH> = {
    'O+': GrupoRH.O_POS, 'O-': GrupoRH.O_NEG,
    'A+': GrupoRH.A_POS, 'A-': GrupoRH.A_NEG,
    'B+': GrupoRH.B_POS, 'B-': GrupoRH.B_NEG,
    'AB+': GrupoRH.AB_POS, 'AB-': GrupoRH.AB_NEG,
  };
  return map[v] ?? null;
};

const mapDiscapacidad = (d?: string | null): DiscapacidadTipo | null => {
  if (!d) return null;
  const t = d.toLowerCase();
  if (t.includes('visual')) return DiscapacidadTipo.VISUAL;
  if (t.includes('audit')) return DiscapacidadTipo.AUDITIVA;
  if (t.includes('motor')) return DiscapacidadTipo.MOTORA;
  if (t.includes('cogn')) return DiscapacidadTipo.COGNITIVA;
  if (t.includes('ninguna') || t === '') return DiscapacidadTipo.NINGUNA;
  return DiscapacidadTipo.OTRA;
};

const coerceDate = (s?: string | null) => (s ? new Date(s) : null);

function mapPayload(body: any) {
  // admite payload “tipo UI” (nombres de inputs) o “tipo modelo”
  const tipoDoc = (body.tipoDoc || body.tipo_doc || 'CC') as TipoDocumento;
  const doc = (body.doc ?? body.num_doc) as string;

  const data: Prisma.BeneficiarioCreateInput = {
    tipoDoc,
    doc,
    nombres: body.nombres ?? '',
    apellidos: body.apellidos ?? '',
    fechaNacimiento: coerceDate(body.fechaNacimiento ?? body.fecha_nac) ?? undefined,
    sexo: mapSexo(body.sexo) ?? undefined,

    telefono: body.telefono ?? undefined,
    celular: body.celular ?? undefined,
    email: body.email ?? undefined,

    direccion: body.direccion ?? undefined,
    barrio: body.barrio ?? undefined,
    ciudad: body.ciudad ?? undefined,
    departamento: body.departamento ?? body.dpto ?? undefined,
    zona: mapZona(body.zona) ?? undefined,

    eps: body.eps ?? undefined,
    rh: mapRH(body.rh) ?? undefined,
    discapacidad: mapDiscapacidad(body.discapacidad) ?? undefined,
    discapacidadDetalle: body.discapacidadDetalle ?? undefined,
    alergias: body.alergias ?? undefined,
    medicamentos: body.medicamentos ?? undefined,
    antecedentes: body.antecedentes ?? undefined,

    comunidad: body.comunidad ?? undefined,
    lengua: body.lengua ?? undefined,
    practicasCulturales: body.practicas ?? body.practicasCulturales ?? undefined,

    urgenciaNombre: body.urg_nombre ?? body.urgenciaNombre ?? undefined,
    urgenciaParentesco: body.urg_parentesco ?? body.urgenciaParentesco ?? undefined,
    urgenciaTelefono: body.urg_tel ?? body.urgenciaTelefono ?? undefined,
    urgenciaDireccion: body.urg_dir ?? body.urgenciaDireccion ?? undefined,

    // flex
    acudientes: body.acudientes ? (body.acudientes as Prisma.InputJsonValue) : undefined,
    docs: body.docs
      ? (body.docs as Prisma.InputJsonValue)
      : (body.docsMeta as Prisma.InputJsonValue) ?? undefined,
  };

  return data;
}

/* ==== GET: lista con filtros básicos ==== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const take = Number(searchParams.get('take') ?? 50);
  const skip = Number(searchParams.get('skip') ?? 0);

  const where = q
    ? {
      OR: [
        { doc: { contains: q, mode: 'insensitive' } },
        { nombres: { contains: q, mode: 'insensitive' } },
        { apellidos: { contains: q, mode: 'insensitive' } },
        { ciudad: { contains: q, mode: 'insensitive' } },
      ],
    }
    : {};

  const [items, total] = await Promise.all([
    prisma.beneficiario.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.beneficiario.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

/* ==== POST: crear beneficiario ==== */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.doc && !body?.num_doc) {
      return NextResponse.json({ error: 'doc/num_doc es requerido' }, { status: 400 });
    }

    const data = mapPayload(body);

    const created = await prisma.beneficiario.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

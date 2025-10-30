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

/** Mapea payload tipo UI → modelo Prisma (para crear). */
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

/* ==== PUT: actualizar beneficiario (por id o por doc) ==== */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // 1) Preferimos actualizar por id (más seguro); si no, por doc/num_doc
    const id = (body.id as string | undefined)?.trim();
    const docWhere = (body.doc ?? body.num_doc) as string | undefined;

    if (!id && !docWhere) {
      return NextResponse.json(
        { error: 'Para actualizar envía "id" o "doc/num_doc".' },
        { status: 400 }
      );
    }

    // 2) Mapeamos el payload como si fuera "create"
    const mapped = mapPayload(body) as Prisma.BeneficiarioCreateInput;

    // 3) Para UPDATE, evitamos sobreescribir con cadenas vacías:
    const sanitizedEntries = Object.entries(mapped).map(([k, v]) => [k, v === '' ? undefined : v]);
    const mappedSanitized = Object.fromEntries(sanitizedEntries) as Record<string, any>;

    // 4) No cambiamos el documento cuando hacemos where por doc (a menos que llegue id + docNuevo)
    //    Evitamos confusiones y colisiones con el índice único "doc".
    const { doc: _ignoreDocForUpdate, ...rest } = mappedSanitized;

    const data: Prisma.BeneficiarioUpdateInput = { ...rest };

    // Si viene id y quieren cambiar el número de documento:
    if (id && (body.docNuevo || body.num_doc_nuevo)) {
      data.doc = String(body.docNuevo ?? body.num_doc_nuevo);
    }

    const updated = await prisma.beneficiario.update({
      where: id ? { id } : { doc: String(docWhere) },
      data,
      select: {
        id: true,
        tipoDoc: true,
        doc: true,
        nombres: true,
        apellidos: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e: any) {
    // P2025 = no existe el registro a actualizar
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Beneficiario no encontrado.' }, { status: 404 });
    }
    // P2002 = violación de índice único (por ejemplo, al intentar cambiar doc a uno ya existente)
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe otro beneficiario con ese número de documento.' },
        { status: 409 }
      );
    }
    console.error('PUT /api/beneficiarios error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

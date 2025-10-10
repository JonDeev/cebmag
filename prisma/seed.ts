// prisma/seed.ts
import {
  PrismaClient,
  Prisma,
  // Enums
  TipoDocumento, Sexo, Zona, GrupoRH, DiscapacidadTipo, RegimenSalud, EstadoCivil, Etnia,
  PQRSKind, PQRSStatus, PQRSOrigen, PQRSCanal,
  ActividadEstado, GastoCategoria, MetodoPago,
  TipoPersonal, InscripcionEstado, Modalidad, Jornada, SalarioTipo, Periodo,
  EncuestaEstado, EntregaEstado,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const today = () => new Date();
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

async function main() {
  console.log('→ Seed: roles/usuarios');
  /* -------- Roles y usuarios -------- */
  const [adminRole, agentRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Administrador del sistema' },
    }),
    prisma.role.upsert({
      where: { name: 'agent' },
      update: {},
      create: { name: 'agent', description: 'Agente / Mesa de ayuda' },
    }),
  ]);

  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cebmag.local' },
    update: {},
    create: { email: 'admin@cebmag.local', password: adminPass, nombre: 'Admin CEBMAG', activo: true },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('→ Seed: actividades A1..A8');
  /* -------- Actividades (A1..A8) -------- */
  const actsData = [
    { codigo: 'A1', nombre: 'Actividad 1', presupuesto: 12_000_000 },
    { codigo: 'A2', nombre: 'Actividad 2', presupuesto: 18_000_000 },
    { codigo: 'A3', nombre: 'Actividad 3', presupuesto: 22_000_000 },
    { codigo: 'A4', nombre: 'Actividad 4', presupuesto: 10_000_000 },
    { codigo: 'A5', nombre: 'Actividad 5', presupuesto: 8_000_000 },
    { codigo: 'A6', nombre: 'Actividad 6', presupuesto: 7_500_000 },
    { codigo: 'A7', nombre: 'Actividad 7', presupuesto: 9_500_000 },
    { codigo: 'A8', nombre: 'Actividad 8', presupuesto: 6_000_000 },
  ];

  for (const a of actsData) {
    await prisma.actividad.upsert({
      where: { codigo: a.codigo },
      update: { nombre: a.nombre, presupuesto: a.presupuesto, estado: ActividadEstado.ABIERTA },
      create: { codigo: a.codigo, nombre: a.nombre, presupuesto: a.presupuesto, estado: ActividadEstado.ABIERTA },
    });
  }

  const acts = await prisma.actividad.findMany();
  const byCode = Object.fromEntries(acts.map(a => [a.codigo, a.id]));

  console.log('→ Seed: beneficiarios');
  /* -------- Beneficiarios de ejemplo -------- */
  const juan = await prisma.beneficiario.upsert({
    where: { doc: '1050' },
    update: {},
    create: {
      tipoDoc: TipoDocumento.CC,
      doc: '1050',
      nombres: 'Juan',
      apellidos: 'Torres',
      fechaNacimiento: new Date('1990-03-20'),
      sexo: Sexo.MASCULINO,
      telefono: '3000000000',
      email: 'juan@correo.com',
      direccion: 'Calle 10 # 20-30',
      barrio: 'Centro',
      ciudad: 'Santa Marta',
      departamento: 'Magdalena',
      zona: Zona.URBANA,
      eps: 'Nueva EPS',
      rh: GrupoRH.O_POS,
      alergias: 'Penicilina',
      regimen: RegimenSalud.CONTRIBUTIVO,
      estadoCivil: EstadoCivil.SOLTERO,
      etnia: Etnia.NO_INFORMA,
      activo: true,
    },
  });

  const maria = await prisma.beneficiario.upsert({
    where: { doc: '2255' },
    update: {},
    create: {
      tipoDoc: TipoDocumento.CC,
      doc: '2255',
      nombres: 'María',
      apellidos: 'Gómez',
      sexo: Sexo.FEMENINO,
      telefono: '3011111111',
      ciudad: 'Santa Marta',
      departamento: 'Magdalena',
      zona: Zona.URBANA,
      eps: 'Sura',
      rh: GrupoRH.A_NEG,
      discapacidad: DiscapacidadTipo.NINGUNA,
      activo: true,
    },
  });

  console.log('→ Seed: PQRS');
  /* -------- PQRS de ejemplo -------- */
  await prisma.pQRS.upsert({
    where: { radicado: 'PQ-2025-0001' },
    update: {},
    create: {
      radicado: 'PQ-2025-0001',
      fecha: today(),
      tipo: PQRSKind.PETICION,
      estado: PQRSStatus.ABIERTA,
      origen: PQRSOrigen.BENEFICIARIO,
      canal: PQRSCanal.WEB,
      solicitante: { doc: '1050', nombre: 'Juan Torres', telefono: '3000000000', email: 'juan@correo.com' } as Prisma.InputJsonValue,
      asunto: 'Solicitud de cita prioritaria',
      descripcion: 'Requiere cita prioritaria por síntoma agudo.',
      responsable: 'Mesa de ayuda',
      vencimiento: addDays(today(), 15),
      adjuntos: [] as Prisma.InputJsonValue,
      historial: [{ fecha: new Date().toISOString().slice(0, 10), evento: 'Radicado', nota: 'Generado por seed' }] as Prisma.InputJsonValue,
      beneficiarioId: juan.id,
      responsableUserId: admin.id,
    },
  });

  await prisma.pQRS.upsert({
    where: { radicado: 'PQ-2025-0002' },
    update: {},
    create: {
      radicado: 'PQ-2025-0002',
      fecha: today(),
      tipo: PQRSKind.QUEJA,
      estado: PQRSStatus.EN_TRAMITE,
      origen: PQRSOrigen.TERCERO,
      canal: PQRSCanal.TELEFONO,
      solicitante: { doc: '', nombre: 'María Gómez', telefono: '3011111111', email: '' } as Prisma.InputJsonValue,
      asunto: 'Demora en atención',
      descripcion: 'Reporta demora en atención del servicio.',
      responsable: 'Calidad',
      vencimiento: addDays(today(), 10),
      adjuntos: [{ name: 'audio-llamada.pdf', size: 120000 }] as Prisma.InputJsonValue,
      historial: [{ fecha: new Date().toISOString().slice(0, 10), evento: 'Radicado' }, { fecha: new Date().toISOString().slice(0, 10), evento: 'Asignado a Calidad', nota: 'Ticket derivado.' }] as Prisma.InputJsonValue,
      beneficiarioId: maria.id,
      responsableUserId: admin.id,
    },
  });

  console.log('→ Seed: entregas');
  /* -------- Entrega (kits) -------- */
  await prisma.entrega.upsert({
    where: { comprobante: 'ENT-0001' },
    update: {},
    create: {
      comprobante: 'ENT-0001',
      fecha: today(),
      responsable: 'Bodega Central',
      estado: EntregaEstado.PENDIENTE,
      kit: 'Kit básico',
      items: [{ nombre: 'Jabón', unidad: 'u', cantidad: 3 }, { nombre: 'Alcohol', unidad: 'ml', cantidad: 250 }] as Prisma.InputJsonValue,
      observaciones: 'Entrega inicial',
      beneficiarioId: juan.id,
    },
  });

  console.log('→ Seed: gastos');
  /* -------- Gastos de ejemplo -------- */
  await prisma.gasto.upsert({
    where: { id: 'seed-gasto-1' }, // clave sintética para idempotencia
    update: {},
    create: {
      id: 'seed-gasto-1',
      fecha: today(),
      actividadId: byCode['A3'],
      categoria: GastoCategoria.INSUMOS,
      descripcion: 'Compra de medicamentos básicos',
      proveedor: 'Farmacia Central',
      metodo: MetodoPago.TRANSFERENCIA,
      documento: 'FV-00123',
      valor: 1_800_000,
      adjuntos: [] as Prisma.InputJsonValue,
    },
  });

  await prisma.gasto.upsert({
    where: { id: 'seed-gasto-2' },
    update: {},
    create: {
      id: 'seed-gasto-2',
      fecha: today(),
      actividadId: byCode['A7'],
      categoria: GastoCategoria.HONORARIOS,
      descripcion: 'Profesional Fisioterapeuta (sesiones)',
      proveedor: 'Clinisalud',
      metodo: MetodoPago.TRANSFERENCIA,
      documento: 'CT-7788',
      valor: 2_400_000,
      adjuntos: [] as Prisma.InputJsonValue,
    },
  });

  console.log('→ Seed: encuesta + respuesta');
  /* -------- Encuesta + Respuesta -------- */
  const enc = await prisma.encuesta.upsert({
    where: { id: 'seed-enc-1' },
    update: {},
    create: {
      id: 'seed-enc-1',
      titulo: 'Satisfacción del servicio',
      servicio: 'Atención prioritaria',
      estado: EncuestaEstado.ACTIVA,
      descripcion: 'Encuesta corta',
      preguntas: [
        { id: 'p1', texto: '¿Cómo califica la atención?', tipo: 'rating', opciones: [1, 2, 3, 4, 5] },
        { id: 'p2', texto: 'Comentarios', tipo: 'text' },
      ] as Prisma.InputJsonValue,
    },
  });

  await prisma.respuesta.create({
    data: {
      encuestaId: enc.id,
      respondente: { doc: '1050', nombre: 'Juan Torres' } as Prisma.InputJsonValue,
      valores: { p1: 5, p2: 'Muy buena atención' } as Prisma.InputJsonValue,
    },
  });

  console.log('→ Seed: inscripción + contrato');
  /* -------- Inscripción + Contrato -------- */
  const ins = await prisma.inscripcion.upsert({
    where: { radicado: 'INS-2025-0001' },
    update: {},
    create: {
      radicado: 'INS-2025-0001',
      fecha: today(),
      tipo: TipoPersonal.ASISTENCIAL,
      candidato: { doc: '9001', nombres: 'Laura', apellidos: 'Mendoza', telefono: '3002223344', email: 'laura@correo.com', direccion: 'Cra 5 # 10-11', ciudad: 'Santa Marta' } as Prisma.InputJsonValue,
      cargo: 'Enfermera',
      actividad: 'A4 • Atención de enfermería',
      estado: InscripcionEstado.EN_EVALUACION,
      evaluacion: { puntaje: 95, docsOk: { cv: true, cert: true }, concepto: 'Apta', decision: 'APROBAR' } as Prisma.InputJsonValue,
    },
  });

  await prisma.contrato.upsert({
    where: { inscripcionId: ins.id },
    update: {},
    create: {
      inscripcionId: ins.id,
      modalidad: Modalidad.PRESTACION_SERVICIOS,
      jornada: Jornada.TIEMPO_COMPLETO,
      salarioTipo: SalarioTipo.HONORARIOS,
      valor: 3_500_000,
      periodo: Periodo.MENSUAL,
      inicio: today(),
      fin: addDays(today(), 180),
      descripcion: 'Contrato por prestación de servicios',
    },
  });

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

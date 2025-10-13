-- CreateEnum
CREATE TYPE "PQRSKind" AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA');

-- CreateEnum
CREATE TYPE "PQRSStatus" AS ENUM ('ABIERTA', 'EN_TRAMITE', 'RESUELTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "PQRSOrigen" AS ENUM ('BENEFICIARIO', 'TERCERO');

-- CreateEnum
CREATE TYPE "PQRSCanal" AS ENUM ('WEB', 'TELEFONO', 'PRESENCIAL', 'EMAIL');

-- CreateEnum
CREATE TYPE "EncuestaEstado" AS ENUM ('BORRADOR', 'ACTIVA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "EntregaEstado" AS ENUM ('PENDIENTE', 'PARCIAL', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "ActividadEstado" AS ENUM ('Abierta', 'Cerrada');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('Efectivo', 'Transferencia', 'Cheque', 'Otro');

-- CreateEnum
CREATE TYPE "GastoCategoria" AS ENUM ('Personal', 'Honorarios', 'Transporte', 'Insumos', 'Alquiler', 'Papelería', 'Logística', 'Otros');

-- CreateEnum
CREATE TYPE "TipoPersonal" AS ENUM ('ADMINISTRATIVO', 'ASISTENCIAL');

-- CreateEnum
CREATE TYPE "InscripcionEstado" AS ENUM ('EN_EVALUACION', 'APROBADA', 'RECHAZADA', 'CONTRATO_GENERADO', 'FIRMADO');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('APROBAR', 'RECHAZAR');

-- CreateEnum
CREATE TYPE "Jornada" AS ENUM ('TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'POR_HORAS');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('PRESTACION_SERVICIOS', 'TEMPORAL', 'INDEFINIDO');

-- CreateEnum
CREATE TYPE "SalarioTipo" AS ENUM ('SALARIO', 'HONORARIOS');

-- CreateEnum
CREATE TYPE "Periodo" AS ENUM ('MENSUAL', 'QUINCENAL', 'POR_SERVICIO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CC', 'TI', 'CE', 'RC', 'PA', 'PEP', 'PPT', 'NIT', 'OTRO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('FEMENINO', 'MASCULINO', 'OTRO');

-- CreateEnum
CREATE TYPE "RegimenSalud" AS ENUM ('CONTRIBUTIVO', 'SUBSIDIADO', 'ESPECIAL', 'EXCEPCION', 'PARTICULAR', 'NO_INFORMA');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTERO', 'CASADO', 'UNION_LIBRE', 'SEPARADO', 'DIVORCIADO', 'VIUDO', 'NO_INFORMA');

-- CreateEnum
CREATE TYPE "Etnia" AS ENUM ('INDIGENA', 'AFROCOLOMBIANO', 'RAIZAL', 'PALENQUERO', 'ROM', 'NINGUNA', 'OTRA', 'NO_INFORMA');

-- CreateEnum
CREATE TYPE "Zona" AS ENUM ('URBANA', 'RURAL');

-- CreateEnum
CREATE TYPE "GrupoRH" AS ENUM ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-');

-- CreateEnum
CREATE TYPE "DiscapacidadTipo" AS ENUM ('NINGUNA', 'VISUAL', 'AUDITIVA', 'MOTORA', 'COGNITIVA', 'OTRA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Beneficiario" (
    "id" TEXT NOT NULL,
    "tipoDoc" "TipoDocumento" NOT NULL DEFAULT 'CC',
    "doc" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "sexo" "Sexo",
    "telefono" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "barrio" TEXT,
    "ciudad" TEXT,
    "departamento" TEXT,
    "zona" "Zona",
    "municipio" TEXT,
    "codigoPostal" TEXT,
    "estrato" INTEGER,
    "sisbenNivel" TEXT,
    "eps" TEXT,
    "rh" "GrupoRH",
    "discapacidad" "DiscapacidadTipo",
    "discapacidadDetalle" TEXT,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "antecedentes" TEXT,
    "comunidad" TEXT,
    "lengua" TEXT,
    "practicasCulturales" TEXT,
    "urgenciaNombre" TEXT,
    "urgenciaParentesco" TEXT,
    "urgenciaTelefono" TEXT,
    "urgenciaDireccion" TEXT,
    "regimen" "RegimenSalud",
    "estadoCivil" "EstadoCivil",
    "etnia" "Etnia",
    "gestante" BOOLEAN,
    "victimaConflicto" BOOLEAN DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "contacto" JSONB,
    "ubicacion" JSONB,
    "medico" JSONB,
    "cultura" JSONB,
    "urgencias" JSONB,
    "acudientes" JSONB,
    "docs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PQRS" (
    "id" TEXT NOT NULL,
    "radicado" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "PQRSKind" NOT NULL,
    "estado" "PQRSStatus" NOT NULL DEFAULT 'ABIERTA',
    "origen" "PQRSOrigen" NOT NULL DEFAULT 'BENEFICIARIO',
    "canal" "PQRSCanal" NOT NULL DEFAULT 'WEB',
    "solicitante" JSONB NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable" TEXT,
    "vencimiento" TIMESTAMP(3),
    "adjuntos" JSONB,
    "historial" JSONB,
    "beneficiarioId" TEXT,
    "responsableUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PQRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encuesta" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "estado" "EncuestaEstado" NOT NULL DEFAULT 'BORRADOR',
    "descripcion" TEXT,
    "creada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preguntas" JSONB NOT NULL,

    CONSTRAINT "Encuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" TEXT NOT NULL,
    "encuestaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondente" JSONB,
    "valores" JSONB NOT NULL,

    CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "comprobante" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "responsable" TEXT NOT NULL,
    "estado" "EntregaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "kit" TEXT,
    "items" JSONB NOT NULL,
    "observaciones" TEXT,
    "adjuntos" JSONB,
    "beneficiarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "presupuesto" INTEGER NOT NULL,
    "estado" "ActividadEstado" NOT NULL DEFAULT 'Abierta',
    "cerradaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "actividadId" TEXT NOT NULL,
    "categoria" "GastoCategoria" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "proveedor" TEXT,
    "metodo" "MetodoPago",
    "documento" TEXT,
    "valor" INTEGER NOT NULL,
    "adjuntos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" TEXT NOT NULL,
    "radicado" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoPersonal" NOT NULL,
    "candidato" JSONB NOT NULL,
    "cargo" TEXT NOT NULL,
    "actividad" TEXT NOT NULL,
    "estado" "InscripcionEstado" NOT NULL DEFAULT 'EN_EVALUACION',
    "evaluacion" JSONB NOT NULL,
    "adjuntos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "inscripcionId" TEXT NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "jornada" "Jornada" NOT NULL,
    "salarioTipo" "SalarioTipo" NOT NULL,
    "valor" INTEGER NOT NULL,
    "periodo" "Periodo" NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "descripcion" TEXT,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiario_doc_key" ON "Beneficiario"("doc");

-- CreateIndex
CREATE INDEX "Beneficiario_tipoDoc_doc_idx" ON "Beneficiario"("tipoDoc", "doc");

-- CreateIndex
CREATE INDEX "Beneficiario_nombres_apellidos_idx" ON "Beneficiario"("nombres", "apellidos");

-- CreateIndex
CREATE INDEX "Beneficiario_departamento_ciudad_barrio_idx" ON "Beneficiario"("departamento", "ciudad", "barrio");

-- CreateIndex
CREATE UNIQUE INDEX "PQRS_radicado_key" ON "PQRS"("radicado");

-- CreateIndex
CREATE INDEX "PQRS_estado_idx" ON "PQRS"("estado");

-- CreateIndex
CREATE INDEX "PQRS_fecha_idx" ON "PQRS"("fecha");

-- CreateIndex
CREATE INDEX "PQRS_origen_idx" ON "PQRS"("origen");

-- CreateIndex
CREATE INDEX "PQRS_canal_idx" ON "PQRS"("canal");

-- CreateIndex
CREATE INDEX "PQRS_estado_vencimiento_idx" ON "PQRS"("estado", "vencimiento");

-- CreateIndex
CREATE INDEX "Encuesta_estado_idx" ON "Encuesta"("estado");

-- CreateIndex
CREATE INDEX "Respuesta_encuestaId_fecha_idx" ON "Respuesta"("encuestaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Entrega_comprobante_key" ON "Entrega"("comprobante");

-- CreateIndex
CREATE INDEX "Entrega_estado_idx" ON "Entrega"("estado");

-- CreateIndex
CREATE INDEX "Entrega_fecha_idx" ON "Entrega"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Actividad_codigo_key" ON "Actividad"("codigo");

-- CreateIndex
CREATE INDEX "Actividad_estado_idx" ON "Actividad"("estado");

-- CreateIndex
CREATE INDEX "Gasto_actividadId_fecha_idx" ON "Gasto"("actividadId", "fecha");

-- CreateIndex
CREATE INDEX "Gasto_categoria_idx" ON "Gasto"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_radicado_key" ON "Inscripcion"("radicado");

-- CreateIndex
CREATE INDEX "Inscripcion_estado_idx" ON "Inscripcion"("estado");

-- CreateIndex
CREATE INDEX "Inscripcion_tipo_idx" ON "Inscripcion"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_inscripcionId_key" ON "Contrato"("inscripcionId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PQRS" ADD CONSTRAINT "PQRS_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "Beneficiario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PQRS" ADD CONSTRAINT "PQRS_responsableUserId_fkey" FOREIGN KEY ("responsableUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "Beneficiario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

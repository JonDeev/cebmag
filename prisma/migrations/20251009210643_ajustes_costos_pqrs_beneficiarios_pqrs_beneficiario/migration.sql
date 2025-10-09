/*
  Warnings:

  - The values [ABIERTA,CERRADA,PENDIENTE] on the enum `ActividadEstado` will be removed. If these variants are still used in the database, this will fail.
  - The values [PERSONAL,HONORARIOS,TRANSPORTE,INSUMOS,ALQUILER,PAPELERIA,LOGISTICA,OTROS] on the enum `GastoCategoria` will be removed. If these variants are still used in the database, this will fail.
  - The values [EFECTIVO,TRANSFERENCIA,CHEQUE,OTRO] on the enum `MetodoPago` will be removed. If these variants are still used in the database, this will fail.
  - The `sexo` column on the `Beneficiario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `responsableId` on the `PQRS` table. All the data in the column will be lost.
  - You are about to drop the `Encuesta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Respuesta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Actividad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Gasto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PQRSOrigen" AS ENUM ('BENEFICIARIO', 'TERCERO');

-- CreateEnum
CREATE TYPE "PQRSCanal" AS ENUM ('WEB', 'TELEFONO', 'PRESENCIAL', 'EMAIL');

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

-- AlterEnum
BEGIN;
CREATE TYPE "ActividadEstado_new" AS ENUM ('Abierta', 'Cerrada');
ALTER TABLE "public"."Actividad" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Actividad" ALTER COLUMN "estado" TYPE "ActividadEstado_new" USING ("estado"::text::"ActividadEstado_new");
ALTER TYPE "ActividadEstado" RENAME TO "ActividadEstado_old";
ALTER TYPE "ActividadEstado_new" RENAME TO "ActividadEstado";
DROP TYPE "public"."ActividadEstado_old";
ALTER TABLE "Actividad" ALTER COLUMN "estado" SET DEFAULT 'Abierta';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GastoCategoria_new" AS ENUM ('Personal', 'Honorarios', 'Transporte', 'Insumos', 'Alquiler', 'Papelería', 'Logística', 'Otros');
ALTER TABLE "Gasto" ALTER COLUMN "categoria" TYPE "GastoCategoria_new" USING ("categoria"::text::"GastoCategoria_new");
ALTER TYPE "GastoCategoria" RENAME TO "GastoCategoria_old";
ALTER TYPE "GastoCategoria_new" RENAME TO "GastoCategoria";
DROP TYPE "public"."GastoCategoria_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MetodoPago_new" AS ENUM ('Efectivo', 'Transferencia', 'Cheque', 'Otro');
ALTER TABLE "Gasto" ALTER COLUMN "metodo" TYPE "MetodoPago_new" USING ("metodo"::text::"MetodoPago_new");
ALTER TYPE "MetodoPago" RENAME TO "MetodoPago_old";
ALTER TYPE "MetodoPago_new" RENAME TO "MetodoPago";
DROP TYPE "public"."MetodoPago_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."PQRS" DROP CONSTRAINT "PQRS_responsableId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Respuesta" DROP CONSTRAINT "Respuesta_encuestaId_fkey";

-- AlterTable
ALTER TABLE "Actividad" ADD COLUMN     "cerradaEn" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'Abierta';

-- AlterTable
ALTER TABLE "Beneficiario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alergias" TEXT,
ADD COLUMN     "antecedentes" TEXT,
ADD COLUMN     "barrio" TEXT,
ADD COLUMN     "celular" TEXT,
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "codigoPostal" TEXT,
ADD COLUMN     "comunidad" TEXT,
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "discapacidad" "DiscapacidadTipo",
ADD COLUMN     "discapacidadDetalle" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "eps" TEXT,
ADD COLUMN     "estadoCivil" "EstadoCivil",
ADD COLUMN     "estrato" INTEGER,
ADD COLUMN     "etnia" "Etnia",
ADD COLUMN     "gestante" BOOLEAN,
ADD COLUMN     "lengua" TEXT,
ADD COLUMN     "medicamentos" TEXT,
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "practicasCulturales" TEXT,
ADD COLUMN     "regimen" "RegimenSalud",
ADD COLUMN     "rh" "GrupoRH",
ADD COLUMN     "sisbenNivel" TEXT,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "tipoDoc" "TipoDocumento" NOT NULL DEFAULT 'CC',
ADD COLUMN     "urgenciaDireccion" TEXT,
ADD COLUMN     "urgenciaNombre" TEXT,
ADD COLUMN     "urgenciaParentesco" TEXT,
ADD COLUMN     "urgenciaTelefono" TEXT,
ADD COLUMN     "victimaConflicto" BOOLEAN DEFAULT false,
ADD COLUMN     "zona" "Zona",
DROP COLUMN "sexo",
ADD COLUMN     "sexo" "Sexo";

-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PQRS" DROP COLUMN "responsableId",
ADD COLUMN     "canal" "PQRSCanal" NOT NULL DEFAULT 'WEB',
ADD COLUMN     "origen" "PQRSOrigen" NOT NULL DEFAULT 'BENEFICIARIO',
ADD COLUMN     "responsable" TEXT,
ADD COLUMN     "responsableUserId" TEXT;

-- DropTable
DROP TABLE "public"."Encuesta";

-- DropTable
DROP TABLE "public"."Respuesta";

-- CreateIndex
CREATE INDEX "Actividad_estado_idx" ON "Actividad"("estado");

-- CreateIndex
CREATE INDEX "Beneficiario_tipoDoc_doc_idx" ON "Beneficiario"("tipoDoc", "doc");

-- CreateIndex
CREATE INDEX "Beneficiario_nombres_apellidos_idx" ON "Beneficiario"("nombres", "apellidos");

-- CreateIndex
CREATE INDEX "Beneficiario_departamento_ciudad_barrio_idx" ON "Beneficiario"("departamento", "ciudad", "barrio");

-- CreateIndex
CREATE INDEX "PQRS_origen_idx" ON "PQRS"("origen");

-- CreateIndex
CREATE INDEX "PQRS_canal_idx" ON "PQRS"("canal");

-- CreateIndex
CREATE INDEX "PQRS_estado_vencimiento_idx" ON "PQRS"("estado", "vencimiento");

-- AddForeignKey
ALTER TABLE "PQRS" ADD CONSTRAINT "PQRS_responsableUserId_fkey" FOREIGN KEY ("responsableUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

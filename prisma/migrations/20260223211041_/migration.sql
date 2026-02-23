/*
  Warnings:

  - The primary key for the `Actividad` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Actividad` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Beneficiario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Beneficiario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Contrato` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Contrato` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Encuesta` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Encuesta` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Entrega` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Entrega` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `beneficiarioId` column on the `Entrega` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Gasto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Gasto` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Inscripcion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Inscripcion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PQRS` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PQRS` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `beneficiarioId` column on the `PQRS` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `responsableUserId` column on the `PQRS` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Respuesta` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Respuesta` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Role` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `inscripcionId` on the `Contrato` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `actividadId` on the `Gasto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `encuestaId` on the `Respuesta` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserRole` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roleId` on the `UserRole` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Contrato" DROP CONSTRAINT "Contrato_inscripcionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Entrega" DROP CONSTRAINT "Entrega_beneficiarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Gasto" DROP CONSTRAINT "Gasto_actividadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PQRS" DROP CONSTRAINT "PQRS_beneficiarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PQRS" DROP CONSTRAINT "PQRS_responsableUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Respuesta" DROP CONSTRAINT "Respuesta_encuestaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- AlterTable
ALTER TABLE "Actividad" DROP CONSTRAINT "Actividad_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Beneficiario" DROP CONSTRAINT "Beneficiario_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Beneficiario_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Contrato" DROP CONSTRAINT "Contrato_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "inscripcionId",
ADD COLUMN     "inscripcionId" INTEGER NOT NULL,
ADD CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Encuesta" DROP CONSTRAINT "Encuesta_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Encuesta_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Entrega" DROP CONSTRAINT "Entrega_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "beneficiarioId",
ADD COLUMN     "beneficiarioId" INTEGER,
ADD CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "actividadId",
ADD COLUMN     "actividadId" INTEGER NOT NULL,
ADD CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Inscripcion" DROP CONSTRAINT "Inscripcion_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PQRS" DROP CONSTRAINT "PQRS_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "beneficiarioId",
ADD COLUMN     "beneficiarioId" INTEGER,
DROP COLUMN "responsableUserId",
ADD COLUMN     "responsableUserId" INTEGER,
ADD CONSTRAINT "PQRS_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Respuesta" DROP CONSTRAINT "Respuesta_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "encuestaId",
ADD COLUMN     "encuestaId" INTEGER NOT NULL,
ADD CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "roleId",
ADD COLUMN     "roleId" INTEGER NOT NULL,
ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_inscripcionId_key" ON "Contrato"("inscripcionId");

-- CreateIndex
CREATE INDEX "Gasto_actividadId_fecha_idx" ON "Gasto"("actividadId", "fecha");

-- CreateIndex
CREATE INDEX "Respuesta_encuestaId_fecha_idx" ON "Respuesta"("encuestaId", "fecha");

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

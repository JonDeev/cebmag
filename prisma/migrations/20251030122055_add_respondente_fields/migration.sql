/*
  Warnings:

  - You are about to drop the column `respondente` on the `Respuesta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Respuesta" DROP COLUMN "respondente",
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "tipo_doc" TEXT;

/*
  Warnings:

  - The values [RESUELTA] on the enum `PQRSStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PQRSStatus_new" AS ENUM ('ABIERTA', 'EN_TRAMITE', 'RE_ABIERTO', 'CERRADA');
ALTER TABLE "public"."PQRS" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "PQRS" ALTER COLUMN "estado" TYPE "PQRSStatus_new" USING ("estado"::text::"PQRSStatus_new");
ALTER TYPE "PQRSStatus" RENAME TO "PQRSStatus_old";
ALTER TYPE "PQRSStatus_new" RENAME TO "PQRSStatus";
DROP TYPE "public"."PQRSStatus_old";
ALTER TABLE "PQRS" ALTER COLUMN "estado" SET DEFAULT 'ABIERTA';
COMMIT;

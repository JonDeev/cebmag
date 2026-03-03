-- AlterTable
ALTER TABLE "Beneficiario" ADD COLUMN     "primerApellido" TEXT,
ADD COLUMN     "primerNombre" TEXT,
ADD COLUMN     "segundoApellido" TEXT,
ADD COLUMN     "segundoNombre" TEXT;

-- CreateIndex
CREATE INDEX "Beneficiario_primerNombre_primerApellido_idx" ON "Beneficiario"("primerNombre", "primerApellido");

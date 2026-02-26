-- AlterTable
ALTER TABLE "Entrega" ADD COLUMN     "responsableUserId" INTEGER;

-- CreateIndex
CREATE INDEX "Entrega_responsableUserId_idx" ON "Entrega"("responsableUserId");

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_responsableUserId_fkey" FOREIGN KEY ("responsableUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

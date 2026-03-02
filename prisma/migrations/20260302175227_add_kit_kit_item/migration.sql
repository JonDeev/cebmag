-- AlterTable
ALTER TABLE "Entrega" ADD COLUMN     "kitId" INTEGER;

-- CreateTable
CREATE TABLE "Kit" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitItem" (
    "id" SERIAL NOT NULL,
    "kitId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "opcional" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KitItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kit_nombre_key" ON "Kit"("nombre");

-- CreateIndex
CREATE INDEX "KitItem_kitId_idx" ON "KitItem"("kitId");

-- CreateIndex
CREATE INDEX "Entrega_kitId_idx" ON "Entrega"("kitId");

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

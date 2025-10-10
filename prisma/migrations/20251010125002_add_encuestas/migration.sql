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

-- CreateIndex
CREATE INDEX "Encuesta_estado_idx" ON "Encuesta"("estado");

-- CreateIndex
CREATE INDEX "Respuesta_encuestaId_fecha_idx" ON "Respuesta"("encuestaId", "fecha");

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

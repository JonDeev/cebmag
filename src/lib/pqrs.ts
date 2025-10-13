// src/lib/pqrs.ts
import { prisma } from "./prisma";

export async function nextRadicadoPQRS() {
  const y = new Date().getFullYear();
  const prefix = `PQ-${y}-`;
  const last = await prisma.pQRS.findFirst({
    where: { radicado: { startsWith: prefix } },
    orderBy: { radicado: "desc" },
    select: { radicado: true },
  });
  const seq = last ? parseInt(last.radicado.slice(prefix.length), 10) : 0;
  return `${prefix}${String(seq + 1).padStart(4, "0")}`;
}

// Mapas UI -> Enums DB
export const mapTipo = {
  "Petición": "PETICION",
  "Queja": "QUEJA",
  "Reclamo": "RECLAMO",
  "Sugerencia": "SUGERENCIA",
} as const;

export const mapEstado = {
  "Abierta": "ABIERTA",
  "En trámite": "EN_TRAMITE",
  "Resuelta": "RESUELTA",
  "Cerrada": "CERRADA",
} as const;

export const mapOrigen = {
  "Beneficiario": "BENEFICIARIO",
  "Tercero": "TERCERO",
} as const;

export const mapCanal = {
  "Web": "WEB",
  "Teléfono": "TELEFONO",
  "Presencial": "PRESENCIAL",
  "Email": "EMAIL",
} as const;

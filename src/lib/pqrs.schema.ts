import { z } from "zod";

export const adjSchema = z.object({
  name: z.string(),
  size: z.number().optional(),
  url: z.string().url().optional(),
  mime: z.string().optional(),
});

export const eventoSchema = z.object({
  fecha: z.string(), // "YYYY-MM-DD"
  evento: z.string(),
  nota: z.string().optional(),
});

export const solicitanteSchema = z.object({
  doc: z.string().optional().default(""),
  nombre: z.string().optional().default(""),
  telefono: z.string().optional(),
  email: z.string().optional(),
});

export const createPQRSBody = z.object({
  // si mandas uno, se usa; si no, lo generamos
  radicado: z.string().optional(),

  fecha: z.string().optional(), // YYYY-MM-DD
  tipo: z.enum(["Petición", "Queja", "Reclamo", "Sugerencia"]),
  estado: z.enum(["Abierta", "En trámite", "Resuelta", "Cerrada"]).optional().default("Abierta"),
  origen: z.enum(["Beneficiario", "Tercero"]),
  canal: z.enum(["Web", "Teléfono", "Presencial", "Email"]),

  solicitante: solicitanteSchema,
  asunto: z.string().min(1),
  descripcion: z.string().min(1),
  responsable: z.string().optional(),
  vencimiento: z.string().optional(), // YYYY-MM-DD

  adjuntos: z.array(adjSchema).optional(),
  historial: z.array(eventoSchema).optional().default([]),
});

export const updatePQRSBody = createPQRSBody.partial().extend({
  // no permitimos cambiar id aquí
});

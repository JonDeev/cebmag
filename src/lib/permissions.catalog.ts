// src/lib/permissions.catalog.ts
export const PERMISSION_GROUPS = [
  {
    group: "PQRS",
    perms: [
      { key: "pqrs.read", label: "Ver PQRS" },
      { key: "pqrs.write", label: "Crear/Editar PQRS" },
      { key: "pqrs.assign", label: "Asignar responsable PQRS" },
    ],
  },
  {
    group: "Encuestas",
    perms: [
      { key: "encuestas.read", label: "Ver encuestas" },
      { key: "encuestas.manage", label: "Crear/Editar/Eliminar encuestas" },
      { key: "encuestas.responder", label: "Registrar respuestas" },
    ],
  },
  {
    group: "Inscripciones",
    perms: [
      { key: "inscripciones.read", label: "Ver inscripciones" },
      { key: "inscripciones.manage", label: "Crear/Editar/Eliminar inscripciones" },
      { key: "inscripciones.contrato", label: "Generar contrato / Firmado" },
    ],
  },
  {
    group: "Entregas",
    perms: [
      { key: "entregas.read", label: "Ver entregas" },
      { key: "entregas.manage", label: "Crear/Editar/Eliminar entregas" },
      { key: "entregas.print", label: "Imprimir comprobantes" },
    ],
  },
  {
    group: "Costos",
    perms: [
      { key: "costos.read", label: "Ver costos y gastos" },
      { key: "costos.manage", label: "Crear/Editar/Eliminar gastos" },
      { key: "costos.actividades", label: "Gestionar actividades" },
    ],
  },
  {
    group: "Usuarios y roles",
    perms: [
      { key: "users.read", label: "Ver usuarios" },
      { key: "users.manage", label: "Crear/Editar/Eliminar usuarios" },
      { key: "roles.manage", label: "Crear/Editar roles y permisos" },
    ],
  },
] as const;

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.perms.map((p) => p.key));

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];
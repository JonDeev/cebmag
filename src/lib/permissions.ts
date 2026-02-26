// src/lib/permissions.ts

export const MODULES = [
  "pqrs",
  "encuestas",
  "entregas",
  "costos",
  "inscripciones",
  "usuarios",
  "roles",
] as const;

export type ModuleKey = (typeof MODULES)[number];

export type Permissions = {
  // Solo para mostrar/ocultar módulos del menú
  modules: Record<ModuleKey, boolean>;

  // Opcional: permisos por acciones (si quieres ir más fino)
  actions?: {
    usuarios?: { create?: boolean; update?: boolean; delete?: boolean };
    roles?: { create?: boolean; update?: boolean; delete?: boolean };
    costos?: {
      gastos?: { create?: boolean; update?: boolean; delete?: boolean };
      actividades?: { create?: boolean; update?: boolean; delete?: boolean };
    };
    entregas?: { create?: boolean; update?: boolean; delete?: boolean; print?: boolean };
    encuestas?: { create?: boolean; update?: boolean; delete?: boolean };
    pqrs?: { create?: boolean; update?: boolean; delete?: boolean };
    inscripciones?: { create?: boolean; update?: boolean; delete?: boolean; contrato?: boolean };
  };
};

// ✅ plantilla vacía (nadie ve nada)
export const emptyPermissions = (): Permissions => ({
  modules: Object.fromEntries(MODULES.map((m) => [m, false])) as Record<ModuleKey, boolean>,
  actions: {},
});

// ✅ admin (ve todo y puede todo)
export const adminPermissions = (): Permissions => ({
  modules: Object.fromEntries(MODULES.map((m) => [m, true])) as Record<ModuleKey, boolean>,
  actions: {
    usuarios: { create: true, update: true, delete: true },
    roles: { create: true, update: true, delete: true },
    costos: {
      gastos: { create: true, update: true, delete: true },
      actividades: { create: true, update: true, delete: true },
    },
    entregas: { create: true, update: true, delete: true, print: true },
    encuestas: { create: true, update: true, delete: true },
    pqrs: { create: true, update: true, delete: true },
    inscripciones: { create: true, update: true, delete: true, contrato: true },
  },
});

// ✅ merge tipo OR (si un rol tiene true, queda true)
export function mergePermissions(list: Array<unknown>): Permissions {
  const out = emptyPermissions();

  for (const p of list) {
    if (!p || typeof p !== "object") continue;
    deepMergeOr(out, p as any);
  }

  // asegurar módulos completos
  for (const m of MODULES) out.modules[m] = !!out.modules[m];
  return out;
}

function deepMergeOr(target: any, src: any) {
  for (const k of Object.keys(src || {})) {
    const sv = src[k];
    const tv = target[k];

    if (typeof sv === "boolean") {
      target[k] = Boolean(tv) || sv;
    } else if (sv && typeof sv === "object" && !Array.isArray(sv)) {
      if (!tv || typeof tv !== "object" || Array.isArray(tv)) target[k] = {};
      deepMergeOr(target[k], sv);
    } else {
      if (typeof tv === "undefined") target[k] = sv;
    }
  }
}

// ✅ check rápido para UI
export function canModule(perm: Permissions | null | undefined, module: ModuleKey) {
  return !!perm?.modules?.[module];
}

// ✅ check opcional por acción
export function canAction(perm: Permissions | null | undefined, path: string) {
  // path ejemplo: "costos.gastos.create"
  const parts = path.split(".");
  let cur: any = perm?.actions;
  for (const p of parts) cur = cur?.[p];
  return !!cur;
}
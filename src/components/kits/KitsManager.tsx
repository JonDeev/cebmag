"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AnimatePresence, motion, Reorder, useReducedMotion } from "framer-motion";
import { useDropzone } from "react-dropzone";

/* ================== UI helpers ================== */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost" | "danger";
}) {
  const reduceMotion = useReducedMotion();
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] bg-white hover:bg-slate-50"
      : variant === "danger"
      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "bg-transparent hover:bg-slate-100";

  return (
    <motion.button
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
      className={`${base} ${styles} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "rose" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${map[tone]}`}>
      {children}
    </span>
  );
}

/* ================== Modal animado ================== */
function Modal({
  open,
  onClose,
  title,
  wide,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
              className={[
                wide ? "w-[min(1100px,96vw)]" : "w-[min(820px,92vw)]",
                "max-h-[92vh] overflow-hidden",
                "rounded-xl border border-[var(--subtle)] bg-white shadow-2xl",
                "flex flex-col",
              ].join(" ")}
            >
              <div className="flex items-center justify-between border-b border-[var(--subtle)] px-5 py-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
                  <p className="text-xs text-slate-500">Define el nombre y los items. Esto será la plantilla para tus entregas.</p>
                </div>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-slate-100"
                  aria-label="Cerrar"
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 min-h-0 p-5 overflow-y-auto">{children}</div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-5 py-4">
                {actions}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ================== Types ================== */
type KitItem = {
  id?: number;
  nombre: string;
  unidad?: string | null;
  cantidad: number;
  opcional: boolean;
  orden: number;
};

type Kit = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  items: KitItem[];
};

type KitItemUI = KitItem & { _key: string };

type KitDraft = {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  items: KitItemUI[];
};

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });

  if (res.ok) return (await res.json()) as T;

  let msg = "Error";
  try {
    const data = await res.json();
    msg = data?.message || msg;
  } catch {}
  throw new Error(msg);
}

/* ================== Utils ================== */
function normalizeItems(items: KitItemUI[]): KitItem[] {
  return (items || [])
    .map((it, idx) => ({
      id: it.id,
      nombre: (it.nombre || "").trim(),
      unidad: it.unidad?.trim() ? it.unidad.trim() : null,
      cantidad: Number.isFinite(it.cantidad) ? Math.max(1, Math.trunc(it.cantidad)) : 1,
      opcional: !!it.opcional,
      orden: idx + 1,
    }))
    .filter((it) => it.nombre.length > 0);
}

function emptyDraft(makeKey: () => string): KitDraft {
  return {
    nombre: "",
    descripcion: "",
    activo: true,
    items: [{ _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
  };
}

function parseImportText(text: string): Array<Pick<KitItem, "nombre" | "unidad" | "cantidad" | "opcional">> {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  // Detecta header común
  const maybeHeader = lines[0].toLowerCase();
  const start = maybeHeader.includes("nombre") && (maybeHeader.includes("cantidad") || maybeHeader.includes("unidad")) ? 1 : 0;

  const out: Array<Pick<KitItem, "nombre" | "unidad" | "cantidad" | "opcional">> = [];
  for (const raw of lines.slice(start)) {
    // soporta separadores: , ; | tab
    const parts =
      raw.includes("\t") ? raw.split("\t") : raw.includes(";") ? raw.split(";") : raw.includes("|") ? raw.split("|") : raw.split(",");

    const nombre = String(parts[0] ?? "").trim();
    if (!nombre) continue;

    const unidad = String(parts[1] ?? "UND").trim() || "UND";
    const cantidad = Math.max(1, Math.trunc(Number(String(parts[2] ?? "1").trim()) || 1));

    const opRaw = String(parts[3] ?? "").trim().toLowerCase();
    const opcional = ["1", "si", "sí", "true", "opcional", "x"].includes(opRaw);

    out.push({ nombre, unidad, cantidad, opcional });
  }
  return out;
}

/* ================== Component ================== */
export default function KitsManager() {
  const reduceMotion = useReducedMotion();

  const keyRef = useRef(1);
  const makeKey = () => `it_${keyRef.current++}_${Date.now().toString(36)}`;

  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<KitDraft>(() => emptyDraft(makeKey));
  const [mode, setMode] = useState<"create" | "edit">("create");

  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Kit[]>("/api/kits");
      setKits(data);
    } catch (e: any) {
      toast.error(e.message || "No se pudo cargar los kits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = kits.length;
    const activos = kits.filter((k) => k.activo).length;
    const inactivos = total - activos;
    const items = kits.reduce((acc, k) => acc + (k.items?.length || 0), 0);
    return { total, activos, inactivos, items };
  }, [kits]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return kits.filter((k) => {
      if (onlyActive && !k.activo) return false;
      if (!qq) return true;
      return (
        k.nombre.toLowerCase().includes(qq) ||
        (k.descripcion || "").toLowerCase().includes(qq) ||
        (k.items || []).some((it) => it.nombre.toLowerCase().includes(qq))
      );
    });
  }, [kits, q, onlyActive]);

  function onNew() {
    setMode("create");
    setDraft(emptyDraft(makeKey));
    setImportText("");
    setOpen(true);
  }

  function onEdit(k: Kit) {
    setMode("edit");
    setDraft({
      id: k.id,
      nombre: k.nombre,
      descripcion: k.descripcion ?? "",
      activo: k.activo,
      items: (k.items || []).length
        ? (k.items || []).map((it, idx) => ({
            _key: makeKey(),
            id: it.id,
            nombre: it.nombre,
            unidad: it.unidad ?? "UND",
            cantidad: it.cantidad ?? 1,
            opcional: !!it.opcional,
            orden: idx + 1,
          }))
        : [{ _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
    });
    setImportText("");
    setOpen(true);
  }

  async function onToggleActivo(k: Kit) {
    const next = !k.activo;
    try {
      await api<Kit>(`/api/kits/${k.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: next }),
      });
      toast.success(next ? "Kit activado" : "Kit desactivado");
      await load();
    } catch (e: any) {
      toast.error(e.message || "No se pudo actualizar");
    }
  }

  async function onDeleteSoft(k: Kit) {
    try {
      await api<{ message: string }>(`/api/kits/${k.id}`, { method: "DELETE" });
      toast.success("Kit desactivado");
      await load();
    } catch (e: any) {
      toast.error(e.message || "No se pudo desactivar");
    }
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function updateDraft(patch: Partial<KitDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function updateItem(index: number, patch: Partial<KitItemUI>) {
    setDraft((d) => {
      const items = [...d.items];
      items[index] = { ...items[index], ...patch };
      return { ...d, items };
    });
  }

  function addItem() {
    setDraft((d) => ({
      ...d,
      items: [...d.items, { _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: d.items.length + 1 }],
    }));
  }

  function removeItem(index: number) {
    setDraft((d) => {
      const items = d.items.filter((_, i) => i !== index);
      return {
        ...d,
        items: items.length
          ? items.map((it, idx) => ({ ...it, orden: idx + 1 }))
          : [{ _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
      };
    });
  }

  function clearItems() {
    setDraft((d) => ({
      ...d,
      items: [{ _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
    }));
  }

  const applyReorder = (next: KitItemUI[]) => {
    setDraft((d) => ({ ...d, items: next.map((it, idx) => ({ ...it, orden: idx + 1 })) }));
  };

  const onImportApply = async () => {
    const rows = parseImportText(importText);
    if (!rows.length) return toast.error("No encontré filas válidas. Usa: nombre,unidad,cantidad,opcional");
    setImporting(true);
    try {
      setDraft((d) => {
        const appended: KitItemUI[] = rows.map((r) => ({
          _key: makeKey(),
          nombre: r.nombre,
          unidad: r.unidad ?? "UND",
          cantidad: r.cantidad ?? 1,
          opcional: !!r.opcional,
          orden: 0,
        })) as any;

        const merged = [...d.items, ...appended]
          .map((it, idx) => ({ ...it, orden: idx + 1 }))
          .filter((it) => (it.nombre || "").trim().length > 0);

        return {
          ...d,
          items: merged.length ? merged : [{ _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
        };
      });

      toast.success(`Items importados: ${rows.length}`);
      setImportText("");
    } finally {
      setImporting(false);
    }
  };

  const drop = useDropzone({
    multiple: false,
    accept: {
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
    maxSize: 2 * 1024 * 1024,
    onDrop: async (files) => {
      const f = files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const rows = parseImportText(text);
        if (!rows.length) return toast.error("El archivo no tiene filas válidas. Usa: nombre,unidad,cantidad,opcional");

        setDraft((d) => {
          const appended: KitItemUI[] = rows.map((r) => ({
            _key: makeKey(),
            nombre: r.nombre,
            unidad: r.unidad ?? "UND",
            cantidad: r.cantidad ?? 1,
            opcional: !!r.opcional,
            orden: 0,
          })) as any;

          const merged = [...d.items, ...appended]
            .map((it, idx) => ({ ...it, orden: idx + 1 }))
            .filter((it) => (it.nombre || "").trim().length > 0);

          return {
            ...d,
            items: merged.length ? merged : [{ _key: makeKey(), nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
          };
        });

        toast.success(`Items importados desde archivo: ${rows.length}`);
      } catch {
        toast.error("No pude leer el archivo.");
      }
    },
  });

  async function onSave() {
    const nombre = draft.nombre.trim();
    if (nombre.length < 2) return toast.error("El nombre del kit es obligatorio");

    const itemsNorm = normalizeItems(draft.items);
    if (!itemsNorm.length) return toast.error("Agrega al menos 1 item válido (con nombre)");

    setSaving(true);
    try {
      if (mode === "create") {
        await api<Kit>("/api/kits", {
          method: "POST",
          body: JSON.stringify({
            nombre,
            descripcion: draft.descripcion?.trim() ? draft.descripcion.trim() : null,
            activo: draft.activo,
            items: itemsNorm,
          }),
        });
        toast.success("Kit creado");
      } else {
        await api<Kit>(`/api/kits/${draft.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            nombre,
            descripcion: draft.descripcion?.trim() ? draft.descripcion.trim() : null,
            activo: draft.activo,
            items: itemsNorm,
          }),
        });
        toast.success("Kit actualizado");
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full">
      {/* Top actions */}
      <motion.div
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción o item..."
            className="md:w-[420px]"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="h-4 w-4 rounded border border-[var(--subtle)]"
            />
            Solo activos
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>
            Recargar
          </Button>
          <Button onClick={onNew}>+ Nuevo Kit</Button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
        {[
          { label: "Total kits", value: stats.total, tone: "slate" as const },
          { label: "Activos", value: stats.activos, tone: "emerald" as const },
          { label: "Inactivos", value: stats.inactivos, tone: "rose" as const },
          { label: "Items totales", value: stats.items, tone: "slate" as const },
        ].map((k) => (
          <motion.div
            key={k.label}
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
            className="rounded-md border border-[var(--subtle)] bg-white p-3"
          >
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xl font-semibold text-slate-900">{k.value}</div>
              <Pill tone={k.tone}>{k.tone === "emerald" ? "OK" : k.tone === "rose" ? "OFF" : "INFO"}</Pill>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 rounded-md border border-[var(--subtle)] bg-white">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-slate-500">No hay kits para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 border-b border-[var(--subtle)]">
                <tr>
                  <th className="px-4 py-3">Kit</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((k) => (
                    <motion.tr
                      key={k.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
                      className="border-b border-[var(--subtle)]/70 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{k.nombre}</div>
                        {k.descripcion ? <div className="text-xs text-slate-500">{k.descripcion}</div> : null}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(k.items || []).slice(0, 4).map((it, idx) => (
                            <span
                              key={`${k.id}-${idx}`}
                              className="rounded-full border border-[var(--subtle)] bg-slate-50 px-2 py-1 text-xs text-slate-700"
                            >
                              {it.nombre}
                              {it.cantidad ? ` x${it.cantidad}` : ""}
                            </span>
                          ))}
                          {(k.items || []).length > 4 ? (
                            <span className="text-xs text-slate-500">+{(k.items || []).length - 4} más</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-1 text-xs border",
                            k.activo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200",
                          ].join(" ")}
                        >
                          {k.activo ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => onEdit(k)}>
                            Editar
                          </Button>
                          <Button variant="outline" onClick={() => onToggleActivo(k)}>
                            {k.activo ? "Desactivar" : "Activar"}
                          </Button>
                          <Button variant="danger" onClick={() => onDeleteSoft(k)} title="Desactivar (soft delete)">
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={closeModal}
        title={mode === "create" ? "Crear Kit" : "Editar Kit"}
        wide
        actions={
          <>
            <Button variant="ghost" type="button" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? "Guardando..." : mode === "create" ? "Crear Kit" : "Guardar cambios"}
            </Button>
          </>
        }
      >
        {/* Header fields */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Nombre del kit</span>
            <Input value={draft.nombre} onChange={(e) => updateDraft({ nombre: e.target.value })} placeholder="Ej: KIT DE ASEO" />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Descripción (opcional)</span>
            <Input
              value={draft.descripcion ?? ""}
              onChange={(e) => updateDraft({ descripcion: e.target.value })}
              placeholder="Ej: Kit básico para entrega"
            />
          </label>

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.activo}
                onChange={(e) => updateDraft({ activo: e.target.checked })}
                className="h-4 w-4 rounded border border-[var(--subtle)]"
              />
              Kit activo
            </label>
          </div>
        </div>

        {/* Import zone (Dropzone) */}
        <div className="mt-4 grid gap-3 rounded-md border border-[var(--subtle)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Importar items (Dropzone)</div>
              <div className="text-xs text-slate-500">Arrastra un .csv o .txt con columnas: nombre, unidad, cantidad, opcional</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={onImportApply} disabled={importing || !importText.trim()}>
                {importing ? "Importando..." : "Aplicar texto"}
              </Button>
              <Button variant="outline" type="button" onClick={() => setImportText("")}>
                Limpiar
              </Button>
            </div>
          </div>

          <div
            {...drop.getRootProps()}
            className={[
              "rounded-md border border-dashed p-4 text-center",
              drop.isDragActive ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--subtle)] bg-slate-50",
            ].join(" ")}
          >
            <input {...drop.getInputProps()} />
            <div className="text-sm text-slate-700">
              {drop.isDragActive ? "Suelta el archivo aquí…" : "Arrastra un archivo .csv/.txt aquí o haz clic para seleccionarlo"}
            </div>
            <div className="mt-1 text-xs text-slate-500">Máx. 2MB • Importa y agrega a la lista actual</div>
          </div>

          <Textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Ejemplo:
Jabón,UND,2,NO
Shampoo,UND,1,SI
`}
          />
        </div>

        {/* Items */}
        <div className="mt-4 rounded-md border border-[var(--subtle)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--subtle)] px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Items del kit</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={addItem}>
                + Agregar item
              </Button>
              <Button variant="outline" type="button" onClick={clearItems}>
                Vaciar
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-2 text-xs text-slate-500">
              Tip: arrastra para reordenar (pro). El orden se guarda según la lista.
            </div>

            <Reorder.Group axis="y" values={draft.items} onReorder={applyReorder} className="space-y-2">
              {draft.items.map((it, idx) => (
                <Reorder.Item
                  key={it._key}
                  value={it}
                  className="rounded-md border border-[var(--subtle)] bg-slate-50 p-3"
                  style={{ cursor: "grab" }}
                  whileDrag={{ scale: reduceMotion ? 1 : 1.01 }}
                >
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-5">
                      <label className="text-[11px] text-slate-500">Nombre</label>
                      <Input
                        value={it.nombre}
                        onChange={(e) => updateItem(idx, { nombre: e.target.value })}
                        placeholder="Ej: Jabón"
                      />
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="text-[11px] text-slate-500">Unidad</label>
                      <Input
                        value={it.unidad ?? ""}
                        onChange={(e) => updateItem(idx, { unidad: e.target.value })}
                        placeholder="UND"
                      />
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="text-[11px] text-slate-500">Cantidad</label>
                      <Input
                        type="number"
                        min={1}
                        value={it.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: Number(e.target.value || 1) })}
                      />
                    </div>

                    <div className="flex items-end col-span-6 md:col-span-2">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={it.opcional}
                          onChange={(e) => updateItem(idx, { opcional: e.target.checked })}
                          className="h-4 w-4 rounded border border-[var(--subtle)]"
                        />
                        Opcional
                      </label>
                    </div>

                    <div className="flex items-end justify-end col-span-6 md:col-span-1">
                      <Button variant="danger" type="button" onClick={() => removeItem(idx)} title="Eliminar">
                        ✕
                      </Button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
              <Pill>Orden: {draft.items.length}</Pill>
              <Pill tone="emerald">Se guarda en BD al guardar</Pill>
              <Pill tone="slate">Importación solo rellena lista</Pill>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
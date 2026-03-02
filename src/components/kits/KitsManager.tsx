"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/* ================== UI helpers (estilo blanco) ================== */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] bg-white hover:bg-slate-50"
      : "bg-transparent hover:bg-slate-100";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
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
              <p className="text-xs text-slate-500">
                Define el nombre y los items. Esto será la plantilla para tus entregas.
              </p>
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
        </div>
      </div>
    </div>
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

type KitDraft = {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  items: KitItem[];
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

function normalizeItems(items: KitItem[]): KitItem[] {
  return items
    .map((it, idx) => ({
      ...it,
      nombre: (it.nombre || "").trim(),
      unidad: it.unidad?.trim() ? it.unidad.trim() : null,
      cantidad: Number.isFinite(it.cantidad) ? Math.max(1, Math.trunc(it.cantidad)) : 1,
      opcional: !!it.opcional,
      orden: idx + 1,
    }))
    .filter((it) => it.nombre.length > 0);
}

function emptyDraft(): KitDraft {
  return {
    nombre: "",
    descripcion: "",
    activo: true,
    items: [{ nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
  };
}

/* ================== Component ================== */
export default function KitsManager() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<KitDraft>(emptyDraft());
  const [mode, setMode] = useState<"create" | "edit">("create");

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
    setDraft(emptyDraft());
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
            id: it.id,
            nombre: it.nombre,
            unidad: it.unidad ?? "",
            cantidad: it.cantidad ?? 1,
            opcional: !!it.opcional,
            orden: idx + 1,
          }))
        : [{ nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
    });
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

  function updateItem(index: number, patch: Partial<KitItem>) {
    setDraft((d) => {
      const items = [...d.items];
      items[index] = { ...items[index], ...patch };
      return { ...d, items };
    });
  }

  function addItem() {
    setDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        { nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: d.items.length + 1 },
      ],
    }));
  }

  function removeItem(index: number) {
    setDraft((d) => {
      const items = d.items.filter((_, i) => i !== index);
      return {
        ...d,
        items: items.length
          ? items.map((it, idx) => ({ ...it, orden: idx + 1 }))
          : [{ nombre: "", unidad: "UND", cantidad: 1, opcional: false, orden: 1 }],
      };
    });
  }

  function moveItem(index: number, dir: -1 | 1) {
    setDraft((d) => {
      const items = [...d.items];
      const j = index + dir;
      if (j < 0 || j >= items.length) return d;
      const tmp = items[index];
      items[index] = items[j];
      items[j] = tmp;
      return { ...d, items: items.map((it, idx) => ({ ...it, orden: idx + 1 })) };
    });
  }

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                {filtered.map((k) => (
                  <tr key={k.id} className="border-b border-[var(--subtle)]/70 last:border-b-0">
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
                        <Button
                          variant="outline"
                          onClick={() => onDeleteSoft(k)}
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          title="Desactivar (soft delete)"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal (blanco) */}
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
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Nombre del kit</span>
            <Input
              value={draft.nombre}
              onChange={(e) => updateDraft({ nombre: e.target.value })}
              placeholder="Ej: KIT DE ASEO"
            />
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

        {/* Items */}
        <div className="mt-4 rounded-md border border-[var(--subtle)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Items del kit</div>
            <Button variant="outline" type="button" onClick={addItem}>
              + Agregar item
            </Button>
          </div>

          <div className="p-4 space-y-2">
            {draft.items.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 rounded-md border border-[var(--subtle)] bg-slate-50 p-3"
              >
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

                <div className="flex items-end justify-end col-span-6 gap-2 md:col-span-1">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    className="h-9 w-9 rounded-md border border-[var(--subtle)] bg-white hover:bg-slate-100"
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    className="h-9 w-9 rounded-md border border-[var(--subtle)] bg-white hover:bg-slate-100"
                    title="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="border rounded-md h-9 w-9 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div className="text-xs text-slate-500">
              Tip: Puedes dejar “unidad” en blanco si no aplica. El orden se guarda según la lista.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
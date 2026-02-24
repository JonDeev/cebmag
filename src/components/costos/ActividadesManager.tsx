"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Save, X, Trash2 } from "lucide-react";

import {
  getActividades,
  patchActividades,
  createActividad,
  deleteActividad,
  type Actividad,
} from "@/lib/costos.api";

import ConfirmModal from "@/components/ui/ConfirmModal";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30 ${
        props.className || ""
      }`}
    />
  );
}
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] hover:bg-white"
      : "hover:bg-white";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function ActividadesManager({
  onChanged,
}: {
  onChanged?: (items: Actividad[]) => void;
}) {
  const [items, setItems] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);

  // modal crear
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [presupuesto, setPresupuesto] = useState<number>(0);
  const [estado, setEstado] = useState<"Abierta" | "Cerrada">("Abierta");

  // confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState<{
    id: number;
    codigo: string;
    nombre: string;
  } | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await getActividades();
      setItems(data);
      onChanged?.(data);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar actividades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byCodigo = useMemo(() => {
    const m = new Map<string, Actividad>();
    items.forEach((a) => m.set(String(a.codigo).toUpperCase(), a));
    return m;
  }, [items]);

  const saveRow = async (a: Actividad) => {
    try {
      const updated = await patchActividades([
        { id: a.id, nombre: a.nombre, presupuesto: a.presupuesto, estado: a.estado },
      ] as any);

      const u = updated?.[0];
      if (u) {
        setItems((prev) => {
          const next = prev.map((x) => (x.id === u.id ? u : x));
          onChanged?.(next);
          return next;
        });
      }
      toast.success("Actividad actualizada ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Error actualizando actividad");
    }
  };

  const create = async () => {
    const c = codigo.trim().toUpperCase();
    if (!c) return toast.error("Código requerido");
    if (!nombre.trim()) return toast.error("Nombre requerido");
    if (byCodigo.has(c)) return toast.error("Ya existe ese código");
    if (!Number.isFinite(presupuesto) || presupuesto < 0)
      return toast.error("Presupuesto inválido");

    try {
      await createActividad({
        codigo: c,
        nombre: nombre.trim(),
        presupuesto,
        estado,
      });

      toast.success("Actividad creada ✅");
      setOpen(false);
      setCodigo("");
      setNombre("");
      setPresupuesto(0);
      setEstado("Abierta");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear");
    }
  };

  const askDelete = (a: Actividad) => {
    setToDelete({ id: a.id, codigo: a.codigo, nombre: a.nombre });
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      setConfirmLoading(true);
      const ok = await deleteActividad(toDelete.id);
      if (ok) {
        toast.success("Actividad eliminada ✅");
        setConfirmOpen(false);
        setToDelete(null);
        await reload();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-[var(--subtle)] bg-[var(--panel)]">
      <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
        <div className="text-sm font-semibold">Actividades</div>
        <Button variant="outline" type="button" onClick={() => setOpen(true)}>
          <Plus size={16} /> Crear actividad
        </Button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando…</div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-sm">
                <colgroup>
                <col style={{ width: 90 }} />   {/* Código */}
                <col style={{ width: 420 }} />  {/* Nombre (más ancho) */}
                <col style={{ width: 180 }} />  {/* Presupuesto */}
                <col style={{ width: 160 }} />  {/* Estado */}
                <col style={{ width: 200 }} />  {/* Acciones */}
                </colgroup>

                <thead className="border-b border-[var(--subtle)] text-slate-500">
                <tr>
                    <th className="px-2 py-2 text-left">Código</th>
                    <th className="px-2 py-2 text-left">Nombre</th>
                    <th className="px-2 py-2 text-right">Presupuesto</th>
                    <th className="px-2 py-2 text-left">Estado</th>
                    <th className="px-2 py-2 text-left">Acciones</th>
                </tr>
                </thead>

                <tbody>
                {items.map((a) => (
                    <tr key={a.id} className="border-b border-[var(--subtle)]/70 align-top">
                    <td className="px-2 py-2 font-medium">{a.codigo}</td>

                    <td className="px-2 py-2">
                        <Input
                        value={a.nombre}
                        onChange={(e) =>
                            setItems((prev) =>
                            prev.map((x) => (x.id === a.id ? { ...x, nombre: e.target.value } : x))
                            )
                        }
                        className="w-full"
                        />
                    </td>

                    <td className="px-2 py-2">
                        <Input
                        type="number"
                        min={0}
                        value={a.presupuesto}
                        onChange={(e) =>
                            setItems((prev) =>
                            prev.map((x) =>
                                x.id === a.id ? { ...x, presupuesto: Number(e.target.value || 0) } : x
                            )
                            )
                        }
                        className="w-full text-right tabular-nums"
                        />
                    </td>

                    <td className="px-2 py-2">
                        <Select
                        value={a.estado}
                        onChange={(e) =>
                            setItems((prev) =>
                            prev.map((x) => (x.id === a.id ? { ...x, estado: e.target.value as any } : x))
                            )
                        }
                        className="w-full"
                        >
                        <option value="Abierta">Abierta</option>
                        <option value="Cerrada">Cerrada</option>
                        </Select>
                    </td>

                    <td className="px-2 py-2">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                        <Button variant="outline" type="button" onClick={() => saveRow(a)}>
                            <Save size={16} /> Guardar
                        </Button>

                        {/* tu botón eliminar (si ya lo tienes) aquí */}
                        {/* <Button variant="ghost" ...>Eliminar</Button> */}
                        </div>
                    </td>
                    </tr>
                ))}

                {items.length === 0 && (
                    <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                        Sin actividades.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>

      {/* Confirm modal eliminar */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar actividad"
        message={
          <div className="grid gap-2">
            <div>
              ¿Eliminar la actividad <b>{toDelete?.codigo}</b> •{" "}
              <b>{toDelete?.nombre}</b>?
            </div>
            <div className="text-xs text-slate-500">
              Si tiene gastos asociados, no se podrá eliminar.
            </div>
          </div>
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setToDelete(null);
        }}
        onConfirm={doDelete}
      />

      {/* Modal crear */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
              <div className="text-sm font-semibold">Crear actividad</div>
              <button className="p-1 rounded hover:bg-slate-100" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 p-4">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Código (ej: A9)</span>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Nombre</span>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Presupuesto</span>
                <Input
                  type="number"
                  min={0}
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(Number(e.target.value || 0))}
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Estado</span>
                <Select value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                  <option value="Abierta">Abierta</option>
                  <option value="Cerrada">Cerrada</option>
                </Select>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-4 py-3">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={create}>
                <Plus size={16} /> Crear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
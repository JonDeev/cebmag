"use client";

import { useEffect, useMemo, useState } from "react";
import { XCircle, MessageSquare, CheckCircle2, Clock, User, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";

/* ===== Tipos UI ===== */
type Estado = "Abierta" | "En trámite" | "Re Abierto" | "Cerrada";

type Evento = { fecha: string; evento: string; nota?: string };
type PQRS = {
  id: string | number;
  radicado?: string;
  estado: Estado;
  responsable?: string;
  historial: Evento[];
};

type Mode = "seguimiento" | "cierre";

/* ===== Normalizadores ===== */
// BD/enum -> UI
function toUIEstado(s: any): Estado {
  const map: Record<string, Estado> = {
    ABIERTA: "Abierta",
    EN_TRAMITE: "En trámite",
    "EN TRAMITE": "En trámite",
    "EN TRÁMITE": "En trámite",
    RE_ABIERTO: "Re Abierto",
    CERRADA: "Cerrada",
    Abierta: "Abierta",
    "En trámite": "En trámite",
    "Re Abierto": "Re Abierto",
    Cerrada: "Cerrada",
  };
  if (map[s]) return map[s];
  const norm = String(s || "").replace(/\s+/g, "_").toUpperCase();
  return (map[norm] as Estado) || "Abierta";
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ClosePqrsModal({
  open,
  onClose,
  pqrsId,
  radicado,
  mode = "seguimiento",
  onUpdated,
  onClosed,
}: {
  open: boolean;
  onClose: () => void;
  pqrsId: string | number | null;
  radicado?: string;
  mode?: Mode;
  onUpdated?: () => void;
  onClosed?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PQRS | null>(null);

  // formulario principal
  const [nota, setNota] = useState("");
  const [responsable, setResponsable] = useState("");
  const [estado, setEstado] = useState<Estado>("Abierta");

  // sub-modal de motivo de reapertura
  const [askReopen, setAskReopen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const title = useMemo(
    () =>
      mode === "seguimiento"
        ? `Seguimiento — ${radicado || pqrsId || ""}`
        : `Cerrar PQR — ${radicado || pqrsId || ""}`,
    [mode, radicado, pqrsId]
  );

  /* ===== Cargar detalle y normalizar ===== */
  const load = async () => {
  if (!pqrsId) {
    toast.error("Falta el id de la PQR");
    return;
  }
  try {
    setLoading(true);
    const url = `/api/pqrs/${encodeURIComponent(String(pqrsId))}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`GET ${url} → ${r.status} ${txt || ""}`.trim());
    }
    const j = await r.json();

    const estadoUI = toUIEstado(j.estado ?? j.status);
    const hist: Evento[] = Array.isArray(j.historial) ? j.historial : [];

    setData({
      id: j.id,
      radicado: j.radicado,
      estado: estadoUI,
      responsable: j.responsable ?? "",
      historial: hist,
    });
    setResponsable(j.responsable ?? "");
    setEstado(estadoUI);
  } catch (e: any) {
    console.error(e);
    toast.error(e?.message || "No se pudo cargar el detalle");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (!open) return;
    setNota("");
    setReopenReason("");
    setAskReopen(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pqrsId]);

  if (!open) return null;

  /* ===== Acciones ===== */
  const saveSeguimiento = async () => {
    if (!data) return;

    const nuevoEvento: Evento | null = nota.trim()
      ? { fecha: today(), evento: "Seguimiento", nota: nota.trim() }
      : null;

    const payload: any = {
      responsable,
      estado,              // etiqueta UI (por si tu API la acepta)
      status: estado       // enum/alias (por si tu API usa status y lo normaliza)
    };
    if (nuevoEvento) payload.historial = [...(data.historial || []), nuevoEvento];

    try {
      const res = await fetch(`/api/pqrs/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }
      toast.success("Seguimiento guardado");
      setNota("");
      await load();
      onUpdated?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo guardar el seguimiento");
    }
  };

  const cerrarPQR = async () => {
    if (!data) return;
    if (!nota.trim()) return toast.error("Escribe una nota de cierre");

    try {
      // endpoint dedicado
      const res = await fetch(`/api/pqrs/${data.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota: nota.trim() }),
      });

      if (!res.ok) {
        // fallback con PATCH
        const hist = [
          ...(data.historial || []),
          { fecha: today(), evento: "Cerrada", nota: nota.trim() },
        ];
        const r2 = await fetch(`/api/pqrs/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "Cerrada", status: "CERRADA", historial: hist }),
        });
        if (!r2.ok) {
          const t = await r2.text().catch(() => "");
          throw new Error(t || `HTTP ${r2.status}`);
        }
      }

      toast.success("PQR cerrada correctamente");
      onClosed?.();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo cerrar la PQR");
    }
  };

  // Reabrir con motivo → guarda RE_ABIERTO en BD y evento "Reabierta"
  const reabrirPQR = async () => {
    if (!data) return;
    const reason = reopenReason.trim();
    if (!reason) return toast.error("Indica el motivo de reapertura");

    const hist = [
      ...(data.historial || []),
      { fecha: today(), evento: "Reabierta", nota: reason },
    ];

    try {
      const res = await fetch(`/api/pqrs/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Mandamos ambas claves por compatibilidad con tu API
        body: JSON.stringify({
          estado: "RE_ABIERTO",
          status: "RE_ABIERTO",
          historial: hist,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }

      toast.success("PQR reabierta");
      setAskReopen(false);
      setReopenReason("");

      // refresca desde backend
      await load();
      onUpdated?.();

      // Fallback visual inmediato
      setData((curr) => (curr ? { ...curr, estado: "Re Abierto", historial: hist } : curr));
      setEstado("Re Abierto");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo reabrir la PQR");
    }
  };

  /* ===== UI ===== */
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(900px,98vw)] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--brand)]" />
            <h4 className="text-sm font-semibold">{title}</h4>
            {data?.estado === "Cerrada" && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">Cerrada</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Cerrar">
            <XCircle size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {loading || !data ? (
            <p className="text-sm text-slate-500">{loading ? "Cargando…" : "Sin datos"}</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {/* Col izquierda: seguimiento */}
              <div className="grid gap-4">
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-700">Nota</span>
                  <textarea
                    rows={4}
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Añade una nota de seguimiento"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Responsable</span>
                    <input
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Área/Usuario"
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Estado</span>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as Estado)}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                    >
                      <option>Abierta</option>
                      <option>En trámite</option>
                      <option>Re Abierto</option>
                      <option>Cerrada</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Col derecha: historial */}
              <div className="grid gap-3">
                <div className="bg-white border rounded-md border-slate-200">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200">
                    <Clock size={16} className="text-[var(--brand)]" />
                    <span className="text-sm font-semibold">Historial</span>
                  </div>
                  <div className="p-3">
                    {Array.isArray(data.historial) && data.historial.length ? (
                      <ul className="space-y-2">
                        {data.historial.map((h, i) => (
                          <li key={i} className="p-2 text-xs border rounded border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock size={12} className="text-slate-400" />
                              <span className="font-medium">{h.fecha}</span>
                              <span>— {h.evento}</span>
                            </div>
                            {h.nota && <div className="mt-1 whitespace-pre-wrap text-slate-600">{h.nota}</div>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">Sin eventos.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-3 pb-3 text-xs text-slate-500">
                    <User size={14} className="text-slate-400" />
                    Radicado: <span className="font-medium">{data.radicado || radicado || data.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-2 text-sm border rounded-md border-slate-200 hover:bg-white"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={saveSeguimiento}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-slate-200 hover:bg-white disabled:opacity-60"
              title="Guardar nota / cambios"
            >
              <Pencil size={14} />
              Guardar seguimiento
            </button>

            {data?.estado === "Cerrada" ? (
              <button
                onClick={() => setAskReopen(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-md bg-amber-600 hover:opacity-90"
              >
                Reabrir PQR
              </button>
            ) : (
              <button
                onClick={cerrarPQR}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:opacity-90"
              >
                <CheckCircle2 size={14} />
                Cerrar PQR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal: motivo de reapertura */}
      {askReopen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAskReopen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[min(520px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h5 className="text-sm font-semibold">Motivo de reapertura</h5>
              <button onClick={() => setAskReopen(false)} className="p-1 rounded hover:bg-slate-100" aria-label="Cerrar">
                <XCircle size={16} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                placeholder="Describe por qué se reabrió la PQR"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200">
              <button onClick={() => setAskReopen(false)} className="px-3 py-2 text-sm border rounded-md border-slate-200 hover:bg-white">
                Cancelar
              </button>
              <button
                onClick={reabrirPQR}
                className="px-3 py-2 text-sm text-white rounded-md bg-amber-600 hover:opacity-90"
              >
                Reabrir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

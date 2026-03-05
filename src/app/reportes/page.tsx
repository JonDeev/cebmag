"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import DashboardShell from "../_components/DashboardShell";
import toast from "react-hot-toast";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  Filter,
  Calendar,
  Search,
  RefreshCw,
  FileDown,
  Printer,
  BarChart3,
  Package,
  Wallet,
  ClipboardList,
  Users,
} from "lucide-react";

/* ================= UI helpers ================= */
function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
}) {
  const reduceMotion = useReducedMotion();
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "outline"
      ? "border border-[var(--subtle)] hover:bg-white"
      : "hover:bg-white";

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
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none
      focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-[var(--subtle)] bg-[var(--panel)] px-3 py-2 text-sm outline-none
      focus:ring-2 focus:ring-[var(--brand)]/30 ${props.className || ""}`}
    />
  );
}

function Card({
  title,
  value,
  icon,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
      className="rounded-lg border border-[var(--subtle)] bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </motion.div>
  );
}

function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
      className="rounded-lg border border-[var(--subtle)] bg-[var(--panel)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--brand)]">{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

/* ================= Utils ================= */
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

async function readJsonOrText(res: Response) {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw || null;
  }
}
function errMsg(data: any, fallback: string) {
  return (typeof data === "object" ? data?.error || data?.message : data) || fallback;
}

function exportCSV(filename: string, headers: string[], rows: Record<string, any>[]) {
  const lines = rows.map((r) =>
    headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function printTable(title: string, headers: string[], rows: Record<string, any>[]) {
  const html = `
  <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system; padding:16px; color:#0f172a}
        h1{font-size:18px; margin:0 0 10px}
        .meta{font-size:12px; color:#475569; margin-bottom:12px}
        table{border-collapse:collapse; width:100%}
        th,td{border:1px solid #e2e8f0; padding:8px; font-size:12px; text-align:left; vertical-align:top}
        th{background:#f8fafc}
        .wrap{white-space:pre-wrap}
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generado: ${new Date().toLocaleString("es-CO")}</div>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${headers
                  .map((h) => `<td class="wrap">${String(r[h] ?? "")}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
      <script>window.onload=()=>{window.focus(); window.print();}</script>
    </body>
  </html>
  `;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

async function downloadExcel(url: string, filename: string) {
  const t = toast.loading("Generando Excel...");
  try {
    const res = await fetch(url, { method: "GET" });
    const body = res.ok ? null : await readJsonOrText(res).catch(() => null);
    if (!res.ok) throw new Error(errMsg(body, "No se pudo descargar el Excel"));

    const blob = await res.blob();
    const fileUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(fileUrl);
    toast.success("Excel descargado ✅", { id: t });
  } catch (e: any) {
    toast.error(e?.message ?? "Error descargando Excel", { id: t });
  }
}

/* ================= Report definitions ================= */
type ReportKey = "costos" | "entregas" | "pqrs" | "inscripciones" | "beneficiarios";

const REPORTS: Array<{
  key: ReportKey;
  label: string;
  desc: string;
  icon: React.ReactNode;
  headers: string[];
}> = [
  {
    key: "beneficiarios",
    label: "Beneficiarios",
    desc: "Beneficiarios con nombres separados + edad calculada (REAL).",
    icon: <Users size={16} />,
    headers: [
      "tipoDoc",
      "doc",
      "primerNombre",
      "segundoNombre",
      "primerApellido",
      "segundoApellido",
      "fechaNacimiento",
      "edad",
      "sexo",
      "celular",
      "telefono",
      "email",
      "eps",
      "rh",
      "ciudad",
      "departamento",
      "activo",
      "createdAt",
    ],
  },
  {
    key: "costos",
    label: "Costos y gastos",
    desc: "Resumen de gastos por actividad y categoría (REAL).",
    icon: <Wallet size={16} />,
    headers: ["fecha", "actividad", "categoria", "descripcion", "valor"],
  },
  {
    key: "entregas",
    label: "Entregas de insumos/kits",
    desc: "Listado de entregas por beneficiario, estado y responsable (REAL).",
    icon: <Package size={16} />,
    headers: ["comprobante", "fecha", "doc", "beneficiario", "responsable", "estado", "kit", "items", "productos", "obs"]
  },
  {
    key: "pqrs",
    label: "PQRS",
    desc: "Listado de PQRS por estado/tipo/canal (REAL).",
    icon: <FileText size={16} />,
    headers: ["radicado", "fecha", "tipo", "estado", "origen", "canal", "solicitante", "asunto", "responsable", "vencimiento"],
  },
  {
    key: "inscripciones",
    label: "Inscripciones",
    desc: "Inscripciones y contratos (REAL).",
    icon: <ClipboardList size={16} />,
    headers: ["radicado", "fecha", "tipo", "candidato", "doc", "cargo", "actividad", "estado", "puntaje", "decision", "modalidad", "valor", "inicio", "fin"],
  },
];

/* ================= Page ================= */
export default function InformesPage() {
  const title = "Informes";
  const reduceMotion = useReducedMotion();

  const [report, setReport] = useState<ReportKey>("costos");
  const [d1, setD1] = useState(daysAgo(30));
  const [d2, setD2] = useState(today());
  const [q, setQ] = useState("");

  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, any>[]>([]);

  const def = useMemo(() => REPORTS.find((r) => r.key === report)!, [report]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const sumValor = def.headers.includes("valor")
      ? rows.reduce((acc, r) => acc + (Number(r.valor) || 0), 0)
      : 0;

    const groupKey =
      report === "costos" ? "actividad" : report === "entregas" ? "estado" : report === "pqrs" ? "estado" : report === "beneficiarios" ? "departamento" : "actividad";
    const unique = new Set(rows.map((r) => String(r[groupKey] ?? "").trim()).filter(Boolean)).size;

    return { total, sumValor, unique, groupKey };
  }, [rows, report, def.headers]);

  const onGenerate = async () => {
    setGenerated(true);
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (d1) sp.set("d1", d1);
      if (d2) sp.set("d2", d2);
      if (q.trim()) sp.set("q", q.trim());
      sp.set("ts", String(Date.now()));

      const res = await fetch(`/api/reportes/${report}?${sp.toString()}`, {
        cache: "no-store",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
      });

      const body = await readJsonOrText(res);
      if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

      const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
      setRows(items);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el informe");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setGenerated(false);
    setRows([]);
    setLoading(false);
  };

  const onExportCSV = () => exportCSV(`informe_${report}_${today()}.csv`, def.headers, rows);

  const onExportExcel = () => {
    const sp = new URLSearchParams();
    if (d1) sp.set("d1", d1);
    if (d2) sp.set("d2", d2);
    if (q.trim()) sp.set("q", q.trim());

    const url = `/api/reportes/${report}/excel?${sp.toString()}`;
    downloadExcel(url, `informe_${report}_${today()}.xlsx`);
  };

  const onPrint = () => printTable(`Informe — ${def.label}`, def.headers, rows);

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6">
        {/* Filtros */}
        <Section
          title="Generador de informes"
          icon={<FileText size={18} />}
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={onClear}>
                <RefreshCw size={16} /> Limpiar
              </Button>
              <Button type="button" onClick={onGenerate} disabled={loading}>
                <BarChart3 size={16} /> {loading ? "Generando..." : "Generar"}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="grid gap-1 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Filter size={14} /> Tipo de informe
                </span>
                <Select value={report} onChange={(e) => setReport(e.target.value as ReportKey)}>
                  {REPORTS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                <span className="text-xs text-slate-500">{def.desc}</span>
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="grid gap-1 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} /> Desde
                </span>
                <Input type="date" value={d1} onChange={(e) => setD1(e.target.value)} />
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="grid gap-1 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} /> Hasta
                </span>
                <Input type="date" value={d2} onChange={(e) => setD2(e.target.value)} />
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="grid gap-1 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Search size={14} /> Buscar
                </span>
                <Input placeholder="Filtro rápido..." value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
            </div>
          </div>

          {!generated && (
            <div className="mt-4 rounded-md border border-dashed border-[var(--subtle)] bg-white p-4 text-sm text-slate-600">
              Selecciona el tipo de informe, ajusta filtros y presiona <b>Generar</b>.
            </div>
          )}
        </Section>

        {/* KPIs */}
        {generated && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card title="Registros" value={String(kpis.total)} icon={def.icon} />
            <Card
              title="Total valor (si aplica)"
              value={
                def.headers.includes("valor")
                  ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(kpis.sumValor)
                  : "—"
              }
              icon={<Wallet size={16} />}
              hint={!def.headers.includes("valor") ? "Este informe no suma valor." : undefined}
            />
            <Card title={`Agrupaciones (${kpis.groupKey})`} value={String(kpis.unique)} icon={<span className="text-slate-400">∑</span>} />
          </div>
        )}

        {/* Tabla */}
        {generated && (
          <Section
            title={`Resultado — ${def.label}`}
            icon={<BarChart3 size={18} />}
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline" type="button" onClick={onExportExcel} disabled={rows.length === 0 || loading}>
                  <FileDown size={16} /> Exportar Excel
                </Button>
                <Button variant="outline" type="button" onClick={onExportCSV} disabled={rows.length === 0 || loading}>
                  <FileDown size={16} /> CSV
                </Button>
                <Button variant="outline" type="button" onClick={onPrint} disabled={rows.length === 0 || loading}>
                  <Printer size={16} /> Imprimir
                </Button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-[var(--subtle)] text-slate-500">
                  <tr>
                    {def.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={def.headers.length} className="py-6 text-center text-slate-500">
                        Generando…
                      </td>
                    </tr>
                  )}

                  <AnimatePresence initial={false}>
                    {!loading &&
                      rows.map((r, idx) => (
                        <motion.tr
                          key={idx}
                          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.12 }}
                          className="border-b border-[var(--subtle)]/70"
                        >
                          {def.headers.map((h) => (
                            <td key={h} className="px-3 py-2 align-top">
                              <span className="whitespace-pre-wrap">{String(r[h] ?? "—")}</span>
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                  </AnimatePresence>

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={def.headers.length} className="py-6 text-center text-slate-500">
                        Sin resultados con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </DashboardShell>
  );
}
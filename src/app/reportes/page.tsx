"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import toast from "react-hot-toast";
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
  MessagesSquare,
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
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition";
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
  return (
    <div className="rounded-lg border border-[var(--subtle)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
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
  return (
    <div className="rounded-lg border border-[var(--subtle)] bg-[var(--panel)]">
      <div className="flex items-center justify-between border-b border-[var(--subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--brand)]">{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ================= Utils ================= */
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

function toYMD(v: any) {
  if (!v) return "";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

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
    headers
      .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
      .join(",")
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
        th,td{border:1px solid #e2e8f0; padding:8px; font-size:12px; text-align:left}
        th{background:#f8fafc}
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
                  .map((h) => `<td>${String(r[h] ?? "")}</td>`)
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

/* ================= Report definitions ================= */
type ReportKey = "costos" | "entregas" | "pqrs" | "inscripciones";

const REPORTS: Array<{
  key: ReportKey;
  label: string;
  desc: string;
  icon: React.ReactNode;
  headers: string[];
}> = [
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
    headers: ["comprobante", "fecha", "doc", "beneficiario", "responsable", "estado", "kit", "items", "obs"],
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
    headers: [
      "radicado",
      "fecha",
      "tipo",
      "candidato",
      "doc",
      "cargo",
      "actividad",
      "estado",
      "puntaje",
      "decision",
      "modalidad",
      "valor",
      "inicio",
      "fin",
    ],
  },
];

/* ================= Backend (SOLO COSTOS) ================= */
type Act = { id: number; codigo: string; nombre: string };
type Gasto = { fecha: any; actividadId: number; categoria: string; descripcion: string; valor: number };

async function fetchCostosRows(filters: { d1: string; d2: string; q: string }) {
  // 1) actividades
  const rA = await fetch(`/api/costos/actividades?ts=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });
  const aBody = await readJsonOrText(rA);
  if (!rA.ok) throw new Error(errMsg(aBody, `HTTP ${rA.status}`));
  const acts = (Array.isArray(aBody?.items) ? aBody.items : Array.isArray(aBody) ? aBody : []) as Act[];
  const actMap = new Map<number, string>();
  acts.forEach((a) => actMap.set(a.id, `${a.codigo} • ${a.nombre}`));

  // 2) gastos (tu API ya filtra por q/categoria/actividadId, pero aquí usamos solo q+d1+d2)
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.d1) sp.set("d1", filters.d1);
  if (filters.d2) sp.set("d2", filters.d2);
  sp.set("page", "1");
  sp.set("pageSize", "500");
  sp.set("ts", String(Date.now()));

  const rG = await fetch(`/api/costos/gastos?${sp.toString()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });
  const gBody = await readJsonOrText(rG);
  if (!rG.ok) throw new Error(errMsg(gBody, `HTTP ${rG.status}`));
  const gastos = (Array.isArray(gBody?.items) ? gBody.items : Array.isArray(gBody) ? gBody : []) as Gasto[];

  // 3) map a filas del informe
  return gastos.map((g) => ({
    fecha: toYMD(g.fecha),
    actividad: actMap.get(Number(g.actividadId)) ?? `Actividad ${g.actividadId}`,
    categoria: g.categoria,
    descripcion: g.descripcion,
    valor: Number(g.valor ?? 0),
  }));
}

type EntregaApi = {
  comprobante?: string;
  fecha?: any;
  responsable?: string;
  estado?: string;
  kit?: string | null;
  items?: any;
  observaciones?: string | null;
  beneficiario?: any; // puede venir como {doc,nombre} o {doc,nombres,apellidos}
};

function normKey(v: any) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function estadoEntregaToUi(v: any) {
  const k = normKey(v);
  if (k === "PENDIENTE") return "Pendiente";
  if (k === "PARCIAL") return "Parcial";
  if (k === "ENTREGADO") return "Entregado";
  // si ya viene como UI
  if (k === "PENDIENTE") return "Pendiente";
  if (k === "PARCIAL") return "Parcial";
  if (k === "ENTREGADA" || k === "ENTREGADO") return "Entregado";
  return String(v ?? "");
}

function beneficiarioNombre(b: any) {
  if (!b) return "";
  if (typeof b?.nombre === "string" && b.nombre.trim()) return b.nombre.trim();
  const nom = `${b?.nombres ?? ""} ${b?.apellidos ?? ""}`.trim();
  return nom || "";
}

function itemsCount(items: any) {
  if (!items) return 0;
  if (Array.isArray(items)) return items.length;
  // si viene como objeto (json), lo contamos como 1 para no explotar
  return 1;
}

async function fetchEntregasRows(filters: { d1: string; d2: string; q: string }) {
  // Compat: algunos backends usan r1/r2, otros d1/d2
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.d1) {
    sp.set("d1", filters.d1);
    sp.set("r1", filters.d1);
  }
  if (filters.d2) {
    sp.set("d2", filters.d2);
    sp.set("r2", filters.d2);
  }
  sp.set("page", "1");
  sp.set("pageSize", "500");
  sp.set("ts", String(Date.now()));

  const res = await fetch(`/api/entregas?${sp.toString()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });

  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

  const items = (Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : []) as EntregaApi[];

  return items.map((r) => {
    const ben = r.beneficiario ?? {};
    const doc = String(ben?.doc ?? ben?.documento ?? "").trim();

    return {
      comprobante: String(r.comprobante ?? ""),
      fecha: toYMD(r.fecha),
      doc,
      beneficiario: beneficiarioNombre(ben) || "—",
      responsable: String(r.responsable ?? "—"),
      estado: estadoEntregaToUi(r.estado),
      kit: String(r.kit ?? ""),
      items: String(itemsCount(r.items)),
      obs: String((r.observaciones ?? "") || ""),
    };
  });
}

type PqrsApi = {
  radicado?: string;
  fecha?: any;
  tipo?: string;
  estado?: string;
  origen?: string;
  canal?: string;
  solicitante?: any; // Json
  asunto?: string;
  responsable?: string | null;
  vencimiento?: any;
};

function pqrsStatusToUi(v: any) {
  const k = normKey(v);
  if (k === "ABIERTA") return "Abierta";
  if (k === "EN_TRAMITE") return "En trámite";
  if (k === "RE_ABIERTO" || k === "REABIERTO") return "Re-abierto";
  if (k === "CERRADA") return "Cerrada";
  return String(v ?? "");
}

function pqrsTipoToUi(v: any) {
  const k = normKey(v);
  if (k === "PETICION") return "Petición";
  if (k === "QUEJA") return "Queja";
  if (k === "RECLAMO") return "Reclamo";
  if (k === "SUGERENCIA") return "Sugerencia";
  return String(v ?? "");
}

function pqrsOrigenToUi(v: any) {
  const k = normKey(v);
  if (k === "BENEFICIARIO") return "Beneficiario";
  if (k === "TERCERO") return "Tercero";
  return String(v ?? "");
}

function pqrsCanalToUi(v: any) {
  const k = normKey(v);
  if (k === "WEB") return "Web";
  if (k === "TELEFONO") return "Teléfono";
  if (k === "PRESENCIAL") return "Presencial";
  if (k === "EMAIL") return "Email";
  return String(v ?? "");
}

function solicitanteLabel(s: any) {
  if (!s || typeof s !== "object") return "";
  const nombre =
    String(s?.nombre ?? "").trim() ||
    `${String(s?.nombres ?? "").trim()} ${String(s?.apellidos ?? "").trim()}`.trim();
  const doc = String(s?.doc ?? s?.documento ?? "").trim();
  const tel = String(s?.telefono ?? s?.celular ?? "").trim();
  const email = String(s?.email ?? "").trim();
  const parts = [nombre || "", doc ? `(${doc})` : "", tel ? `📞 ${tel}` : "", email ? `✉️ ${email}` : ""].filter(Boolean);
  return parts.join(" ");
}

async function fetchPqrsRows(filters: { d1: string; d2: string; q: string }) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.d1) sp.set("d1", filters.d1);
  if (filters.d2) sp.set("d2", filters.d2);
  sp.set("page", "1");
  sp.set("pageSize", "500");
  sp.set("ts", String(Date.now()));

  // ✅ OJO: si tu ruta es distinta, cámbiala aquí:
  const res = await fetch(`/api/pqrs?${sp.toString()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });

  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

  const items = (Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : []) as PqrsApi[];

  return items.map((r) => ({
    radicado: String(r.radicado ?? ""),
    fecha: toYMD(r.fecha),
    tipo: pqrsTipoToUi(r.tipo),
    estado: pqrsStatusToUi(r.estado),
    origen: pqrsOrigenToUi(r.origen),
    canal: pqrsCanalToUi(r.canal),
    solicitante: solicitanteLabel(r.solicitante) || "—",
    asunto: String(r.asunto ?? ""),
    responsable: String(r.responsable ?? "—"),
    vencimiento: r.vencimiento ? toYMD(r.vencimiento) : "",
  }));

  type InscripcionApi = {
  id?: number;
  radicado?: string;
  fecha?: any;
  tipo?: string;
  candidato?: any; // Json
  cargo?: string;
  actividad?: string;
  estado?: string;
  evaluacion?: any; // Json
  contrato?: any;   // object o null
};

function candidatoNombre(c: any) {
  if (!c || typeof c !== "object") return "";
  const n = String(c?.nombres ?? "").trim();
  const a = String(c?.apellidos ?? "").trim();
  return `${n} ${a}`.trim();
}
}

type InscripcionApi = {
  id?: number;
  radicado?: string;
  fecha?: any;
  tipo?: string;
  candidato?: any; // Json
  cargo?: string;
  actividad?: string;
  estado?: string;
  evaluacion?: any; // Json
  contrato?: any;   // object o null
};

function candidatoNombre(c: any) {
  if (!c || typeof c !== "object") return "";
  const n = String(c?.nombres ?? "").trim();
  const a = String(c?.apellidos ?? "").trim();
  return `${n} ${a}`.trim();
}

async function fetchInscripcionesRows(filters: { d1: string; d2: string; q: string }) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  sp.set("page", "1");
  sp.set("pageSize", "500");
  sp.set("ts", String(Date.now()));

  // ✅ si tu ruta es distinta, cámbiala aquí:
  const res = await fetch(`/api/inscripciones?${sp.toString()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });

  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));

  const items = (Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : []) as InscripcionApi[];

  // 🔎 filtro de fechas local (porque tu API aún no filtra por d1/d2)
  const d1 = filters.d1 || "";
  const d2 = filters.d2 || "";

  const filtered = items.filter((r) => {
    const f = toYMD(r.fecha);
    const ok1 = !d1 || (f && f >= d1);
    const ok2 = !d2 || (f && f <= d2);
    return ok1 && ok2;
  });

  return filtered.map((r) => {
    const cand = r.candidato ?? {};
    const nombre = candidatoNombre(cand) || "—";
    const doc = String(cand?.doc ?? "").trim();

    const ev = r.evaluacion ?? {};
    const puntaje = typeof ev?.puntaje === "number" ? ev.puntaje : "";
    const decision = String(ev?.decision ?? "");

    const c = r.contrato ?? null;
    const modalidad = c ? String(c?.modalidad ?? "") : "";
    const valor = c ? String(c?.valor ?? "") : "";
    const inicio = c?.inicio ? toYMD(c.inicio) : "";
    const fin = c?.fin ? toYMD(c.fin) : "";

    return {
      radicado: String(r.radicado ?? ""),
      fecha: toYMD(r.fecha),
      tipo: String(r.tipo ?? ""),
      candidato: nombre,
      doc,
      cargo: String(r.cargo ?? ""),
      actividad: String(r.actividad ?? ""),
      estado: String(r.estado ?? ""),
      puntaje,
      decision,
      modalidad,
      valor,
      inicio,
      fin,
    };
  });
}

/* ================= Page ================= */
export default function Page() {
  const title = "Informes";

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
    const sumValor = rows.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
    const unique = new Set(rows.map((r) => r.actividad || r.estado || r.tipo || r.beneficiario)).size;
    return { total, sumValor, unique };
  }, [rows]);

  const onGenerate = async () => {
    setGenerated(true);
    setLoading(true);
    try {
      // ✅ SOLO “costos” real, lo demás mock por ahora
      if (report === "costos") {
        const data = await fetchCostosRows({ d1, d2, q });
        setRows(data);
        return;
      }

      // mocks mientras conectamos APIs
      const t = q.trim().toLowerCase();
      if (report === "entregas") {
        const data = await fetchEntregasRows({ d1, d2, q });
        setRows(data);
        return;
      }
      if (report === "pqrs") {
        const data = await fetchPqrsRows({ d1, d2, q });
        setRows(data);
        return;
      }
      if (report === "inscripciones") {
        const data = await fetchInscripcionesRows({ d1, d2, q });
        setRows(data);
        return;
      }
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

  const onExport = () => exportCSV(`informe_${report}_${today()}.csv`, def.headers, rows);
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
                report === "costos"
                  ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(kpis.sumValor)
                  : "—"
              }
              icon={<Wallet size={16} />}
              hint={report !== "costos" ? "Este informe no suma valor." : undefined}
            />
            <Card title="Agrupaciones" value={String(kpis.unique)} icon={<span className="text-slate-400">∑</span>} />
          </div>
        )}

        {/* Tabla */}
        {generated && (
          <Section
            title={`Resultado — ${def.label}`}
            icon={<BarChart3 size={18} />}
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline" type="button" onClick={onExport} disabled={rows.length === 0 || loading}>
                  <FileDown size={16} /> Exportar CSV
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
                      <th key={h} className="px-3 py-2 text-left">
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

                  {!loading &&
                    rows.map((r, idx) => (
                      <tr key={idx} className="border-b border-[var(--subtle)]/70">
                        {def.headers.map((h) => (
                          <td key={h} className="px-3 py-2">
                            {String(r[h] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}

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
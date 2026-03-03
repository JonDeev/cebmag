// src/app/api/beneficiarios/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TipoDocumento, GrupoRH } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "cache-control": "no-store, no-cache, max-age=0",
  pragma: "no-cache",
};

function clean(v: any) {
  return String(v ?? "").trim();
}

function normKey(v: any) {
  return clean(v)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const toYMD = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

function isTipoDocumento(t: string): t is TipoDocumento {
  return (Object.values(TipoDocumento) as string[]).includes(t);
}

function joinParts(...parts: Array<string | null | undefined>) {
  return parts
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

// fallback: si aún no tienes columnas separadas, se derivan desde nombres/apellidos
function split2(full: string) {
  const parts = clean(full).split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? "",
    second: parts.slice(1).join(" ").trim(),
  };
}

/* ================= Mappers UI ================= */
const mapSexo = (s?: string | null) => {
  const k = normKey(s);
  if (!k) return "";
  if (k === "FEMENINO") return "Femenino";
  if (k === "MASCULINO") return "Masculino";
  return "Otro / Prefiere no decir";
};

const mapZona = (z?: string | null) => {
  const k = normKey(z);
  if (!k) return "Urbana";
  if (k === "URBANA") return "Urbana";
  if (k === "RURAL") return "Rural";
  return String(z ?? "");
};

const mapDiscapacidad = (d?: string | null) => {
  const k = normKey(d);
  if (!k || k === "NINGUNA") return "";
  return k.charAt(0) + k.slice(1).toLowerCase();
};

const mapRH = (rh?: GrupoRH | null) => {
  if (!rh) return "";
  const map: Record<string, string> = {
    O_POS: "O+",
    O_NEG: "O-",
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
  };
  return map[String(rh)] ?? String(rh);
};

async function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error("Timeout consultando la base de datos")), ms)
    ),
  ]);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const tipo = normKey(searchParams.get("tipo"));
    const doc = clean(searchParams.get("doc")).toUpperCase();

    if (!tipo || !doc) {
      return NextResponse.json(
        { error: "Faltan parámetros tipo y doc" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (!isTipoDocumento(tipo)) {
      return NextResponse.json(
        { error: "Tipo de documento inválido" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // ✅ CLAVE: select solo columnas que existen hoy en tu BD
    const benef = await withTimeout(
      prisma.beneficiario.findFirst({
        where: { tipoDoc: tipo as TipoDocumento, doc },
        select: {
          id: true,
          tipoDoc: true,
          doc: true,
          fechaNacimiento: true,

          nombres: true,
          apellidos: true,

          sexo: true,
          direccion: true,
          barrio: true,
          ciudad: true,
          departamento: true,
          zona: true,

          telefono: true,
          celular: true,
          email: true,

          eps: true,
          rh: true,
          discapacidad: true,
          alergias: true,
          medicamentos: true,
          antecedentes: true,

          comunidad: true,
          lengua: true,
          practicasCulturales: true,

          urgenciaNombre: true,
          urgenciaParentesco: true,
          urgenciaTelefono: true,
          urgenciaDireccion: true,

          acudientes: true,
          docs: true,
        },
      }),
      8000
    );

    if (!benef) {
      return NextResponse.json(null, { status: 200, headers: NO_STORE_HEADERS });
    }

    // ✅ si aún no existen columnas separadas, las derivamos
    const nom = split2(benef.nombres ?? "");
    const ape = split2(benef.apellidos ?? "");

    const acudientes = Array.isArray(benef.acudientes as any) ? (benef.acudientes as any) : [];
    const docs = Array.isArray(benef.docs as any) ? (benef.docs as any) : [];

    const payload = {
      id: benef.id,
      tipo_doc: benef.tipoDoc,
      num_doc: benef.doc,
      fecha_nac: toYMD(benef.fechaNacimiento),

      // ✅ NUEVO (para tu UI actual)
      primer_nombre: nom.first,
      segundo_nombre: nom.second,
      primer_apellido: ape.first,
      segundo_apellido: ape.second,

      // ✅ COMPAT (por si alguna pantalla aún lo usa)
      nombres: joinParts(nom.first, nom.second) || "",
      apellidos: joinParts(ape.first, ape.second) || "",

      sexo: mapSexo(benef.sexo as any),

      direccion: benef.direccion ?? "",
      barrio: benef.barrio ?? "",
      ciudad: benef.ciudad ?? "",
      dpto: benef.departamento ?? "",
      zona: mapZona(benef.zona as any),

      telefono: benef.telefono ?? "",
      celular: benef.celular ?? "",
      email: benef.email ?? "",

      eps: benef.eps ?? "",
      rh: mapRH(benef.rh),
      discapacidad: mapDiscapacidad(benef.discapacidad as any),

      alergias: benef.alergias ?? "",
      medicamentos: benef.medicamentos ?? "",
      antecedentes: benef.antecedentes ?? "",

      comunidad: benef.comunidad ?? "",
      lengua: benef.lengua ?? "",
      practicas: benef.practicasCulturales ?? "",

      urg_nombre: benef.urgenciaNombre ?? "",
      urg_parentesco: benef.urgenciaParentesco ?? "",
      urg_tel: benef.urgenciaTelefono ?? "",
      urg_dir: benef.urgenciaDireccion ?? "",

      acudientes,
      docs,
    };

    return NextResponse.json(payload, { status: 200, headers: NO_STORE_HEADERS });
  } catch (err: any) {
    console.error("GET /api/beneficiarios/buscar error:", err);
    const status = String(err?.message || "").toLowerCase().includes("timeout") ? 504 : 500;
    return NextResponse.json(
      { error: err?.message ?? "Error interno" },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
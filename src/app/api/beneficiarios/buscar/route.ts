import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TipoDocumento, GrupoRH } from "@prisma/client";

// Mapea enums/valores de BD → etiquetas usadas en la UI
const mapSexo = (s?: string | null) =>
  s === "FEMENINO"
    ? "Femenino"
    : s === "MASCULINO"
    ? "Masculino"
    : s
    ? "Otro / Prefiere no decir"
    : "";

const mapZona = (z?: string | null) => (z === "URBANA" ? "Urbana" : z === "RURAL" ? "Rural" : "");

const mapDiscapacidad = (d?: string | null) => {
  if (!d || d === "NINGUNA") return "";
  return d.charAt(0) + d.slice(1).toLowerCase(); // VISUAL → Visual
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

const toYMD = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

const isTipoDocumento = (t: string): t is TipoDocumento =>
  ["CC", "TI", "CE", "RC", "PA", "PEP", "PPT", "NIT", "OTRO"].includes(t);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipoRaw = (searchParams.get("tipo") ?? "").trim();
    const doc = (searchParams.get("doc") ?? "").trim().toUpperCase();

    if (!tipoRaw || !doc) {
      return NextResponse.json({ error: "Faltan parámetros tipo y doc" }, { status: 400 });
    }

    if (!isTipoDocumento(tipoRaw)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
    }

    const benef = await prisma.beneficiario.findFirst({
      where: { tipoDoc: tipoRaw, doc },
    });

    if (!benef) return NextResponse.json(null, { status: 200 });

    // Payload con nombres EXACTOS de la UI (+ id numérico)
    const payload = {
      id: benef.id, // ✅ AHORA ES Int

      tipo_doc: benef.tipoDoc,
      num_doc: benef.doc,
      fecha_nac: toYMD(benef.fechaNacimiento),

      nombres: benef.nombres ?? "",
      apellidos: benef.apellidos ?? "",
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

      acudientes: Array.isArray(benef.acudientes) ? (benef.acudientes as any) : [],

      // opcional (si quieres que el front lo muestre al buscar):
      docs: Array.isArray(benef.docs) ? (benef.docs as any) : [],
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/beneficiarios/buscar error:", err);
    return NextResponse.json({ error: err?.message ?? "Error interno" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mapea enums/valores de BD → etiquetas usadas en la UI
const mapSexo = (s?: string | null) =>
  s === "FEMENINO" ? "Femenino" : s === "MASCULINO" ? "Masculino" : s ? "Otro / Prefiere no decir" : "";

const mapZona = (z?: string | null) =>
  z === "URBANA" ? "Urbana" : z === "RURAL" ? "Rural" : "";

const mapDiscapacidad = (d?: string | null) => {
  if (!d || d === "NINGUNA") return "";
  return d.charAt(0) + d.slice(1).toLowerCase(); // VISUAL → Visual
};

const toYMD = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const doc = searchParams.get("doc");

    if (!tipo || !doc) {
      return NextResponse.json({ error: "Faltan parámetros tipo y doc" }, { status: 400 });
    }

    const benef = await prisma.beneficiario.findFirst({
      where: { tipoDoc: tipo as any, doc },
    });

    if (!benef) return NextResponse.json(null, { status: 200 });

    // Armar payload con los nombres EXACTOS de la UI
    const payload = {
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
      eps: benef.eps ?? "",
      rh: (benef.rh as any) ?? "",
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
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error interno" }, { status: 500 });
  }
}

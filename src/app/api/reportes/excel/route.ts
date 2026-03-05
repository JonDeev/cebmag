import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs"; // IMPORTANTÍSIMO (no Edge)

type ReportRow = {
  id: number | string;
  nombre: string;
  estado: string;
  valor: number;
  fecha: Date | string;
};

// Simula tu data (aquí metes tu query real: Prisma, SQL, etc.)
async function getReportData(): Promise<ReportRow[]> {
  return [
    { id: 1, nombre: "Ejemplo 1", estado: "ACTIVO", valor: 150000, fecha: new Date() },
    { id: 2, nombre: "Ejemplo 2", estado: "INACTIVO", valor: 89000, fecha: new Date() },
  ];
}

export async function GET() {
  try {
    const rows = await getReportData();

    const wb = new ExcelJS.Workbook();
    wb.creator = "CEBMAG";
    wb.created = new Date();

    const ws = wb.addWorksheet("Reporte", {
      views: [{ state: "frozen", ySplit: 2 }], // congela título + encabezados
    });

    // Título
    ws.mergeCells("A1:E1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "REPORTE CEBMAG";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    ws.getRow(1).height = 24;

    // Encabezados
    const header = ["ID", "Nombre", "Estado", "Valor", "Fecha"];
    ws.addRow(header);

    const headerRow = ws.getRow(2);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 18;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF111827" }, // gris oscuro
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });

    // Columnas (anchos + formatos)
    ws.columns = [
      { key: "id", width: 10 },
      { key: "nombre", width: 34 },
      { key: "estado", width: 14 },
      { key: "valor", width: 16, style: { numFmt: '"$"#,##0' } }, // pesos
      { key: "fecha", width: 18, style: { numFmt: "dd/mm/yyyy" } },
    ];

    // Data
    for (const r of rows) {
      ws.addRow({
        id: r.id,
        nombre: r.nombre,
        estado: r.estado,
        valor: r.valor,
        fecha: typeof r.fecha === "string" ? new Date(r.fecha) : r.fecha,
      });
    }

    // Filtro (encabezados en fila 2)
    ws.autoFilter = {
      from: "A2",
      to: "E2",
    };

    // Estilo filas
    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      row.height = 16;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFF3F4F6" } },
          left: { style: "thin", color: { argb: "FFF3F4F6" } },
          bottom: { style: "thin", color: { argb: "FFF3F4F6" } },
          right: { style: "thin", color: { argb: "FFF3F4F6" } },
        };
        cell.alignment = { vertical: "middle" };
      });
    });

    // Export buffer
    const buf = await wb.xlsx.writeBuffer();
    const file = Buffer.from(buf);

    const filename = `reporte-cebmag-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(file, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "No se pudo generar el Excel" },
      { status: 500 }
    );
  }
}
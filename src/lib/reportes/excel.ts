import ExcelJS from "exceljs";

export const moneyFmt = '"$"#,##0';

export function newWb() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CEBMAG";
  wb.created = new Date();
  return wb;
}

export function styleTitle(ws: ExcelJS.Worksheet, title: string, cols: number) {
  ws.mergeCells(1, 1, 1, cols);
  const c = ws.getCell(1, 1);
  c.value = title;
  c.font = { bold: true, size: 16 };
  c.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 24;
}

export function styleHeader(ws: ExcelJS.Worksheet, rowIdx: number, colCount: number) {
  const r = ws.getRow(rowIdx);
  r.font = { bold: true, color: { argb: "FFFFFFFF" } };
  r.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  r.height = 20;

  for (let i = 1; i <= colCount; i++) {
    const cell = r.getCell(i);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  }
}

export function styleBody(ws: ExcelJS.Worksheet, startRow: number) {
  ws.eachRow((row, idx) => {
    if (idx < startRow) return;
    row.height = 16;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFF3F4F6" } },
        left: { style: "thin", color: { argb: "FFF3F4F6" } },
        bottom: { style: "thin", color: { argb: "FFF3F4F6" } },
        right: { style: "thin", color: { argb: "FFF3F4F6" } },
      };
    });
  });
}
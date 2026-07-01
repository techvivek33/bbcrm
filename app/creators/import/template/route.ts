import * as XLSX from "xlsx";
import { IMPORT_HEADERS, IMPORT_EXAMPLE_ROWS } from "@/lib/creator-import";

export const dynamic = "force-dynamic";

// GET /creators/import/template -> downloads a ready-to-fill .xlsx with the
// correct headings and two example rows. Open in Excel or Google Sheets,
// replace the examples with your data, and upload it back.
export async function GET() {
  const aoa = [IMPORT_HEADERS, ...IMPORT_EXAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = IMPORT_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Creators");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="agency-os-creators-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}

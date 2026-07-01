"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { stringifyList } from "@/lib/serialize";
import { normalizeKey, KEY_ALIASES } from "@/lib/creator-import";

export type ImportError = { row: number; message: string };
export type ImportResult = {
  ok: boolean;
  created: number;
  skipped: number;
  total: number;
  errors: ImportError[];
  message?: string;
};

const AVATAR_PALETTE = [
  "#6366f1", "#0ea5e9", "#f59e0b", "#22c55e", "#ec4899", "#8b5cf6",
  "#ef4444", "#14b8a6", "#eab308", "#a855f7", "#f97316", "#06b6d4",
];

const VALID_STATUS = ["PENDING", "IN_VERIFICATION", "APPROVED", "REJECTED"];
const VALID_GENDER = ["MALE", "FEMALE", "OTHER"];
const VALID_GST = ["REGISTERED", "UNREGISTERED", "NA"];

const toInt = (v: unknown) => {
  const n = parseInt(String(v ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
};
const toFloat = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
};
const toList = (v: unknown) =>
  String(v ?? "")
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
const up = (v: unknown) => String(v ?? "").trim().toUpperCase();

export async function importCreators(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const empty: ImportResult = { ok: false, created: 0, skipped: 0, total: 0, errors: [] };
  const file = formData.get("file");
  if (!file || typeof file === "string" || (file as File).size === 0) {
    return { ...empty, message: "Please choose a .xlsx, .xls or .csv file to upload." };
  }

  // Parse the workbook (xlsx/xls/csv all supported by SheetJS).
  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(await (file as File).arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return { ...empty, message: "The file has no sheets." };
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { ...empty, message: "Could not read the file. Please upload a valid .xlsx or .csv." };
  }

  if (rows.length === 0) return { ...empty, message: "No data rows found under the header." };
  if (rows.length > 2000) return { ...empty, message: "Too many rows — please import at most 2000 creators per file." };

  const errors: ImportError[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +1 header, +1 for 1-based row numbers
    // Canonicalize the row keys via the alias map.
    const r: Record<string, string> = {};
    for (const [rawKey, rawVal] of Object.entries(rows[i])) {
      const canonical = KEY_ALIASES[normalizeKey(rawKey)];
      if (canonical) r[canonical] = String(rawVal ?? "").trim();
    }

    // Skip entirely blank rows silently; flag rows with data but no name.
    const hasAnyValue = Object.values(r).some(Boolean);
    if (!r.name) {
      if (hasAnyValue) {
        errors.push({ row: rowNum, message: "Missing required 'Name' — row skipped." });
        skipped++;
      }
      continue;
    }

    try {
      if (r.email) {
        const exists = await prisma.creator.findFirst({ where: { email: r.email }, select: { id: true } });
        if (exists) {
          errors.push({ row: rowNum, message: `A creator with email ${r.email} already exists — skipped.` });
          skipped++;
          continue;
        }
      }

      const followers = toInt(r.followers);
      const avgViews = toInt(r.avgViews);
      const er = toFloat(r.engagementRate);
      const base = toInt(r.basePrice) || null;
      const gender = VALID_GENDER.includes(up(r.gender)) ? up(r.gender) : null;
      const gst = VALID_GST.includes(up(r.gstStatus)) ? up(r.gstStatus) : null;
      const status = VALID_STATUS.includes(up(r.status)) ? up(r.status) : "APPROVED";
      const platform = r.platform ? up(r.platform) : "INSTAGRAM";
      const color = AVATAR_PALETTE[created % AVATAR_PALETTE.length];

      await prisma.creator.create({
        data: {
          name: r.name,
          email: r.email || null,
          phone: r.phone || null,
          city: r.city || null,
          state: r.state || null,
          location: [r.city, r.state].filter(Boolean).join(", ") || null,
          gender,
          languages: stringifyList(toList(r.languages)),
          categories: stringifyList(toList(r.categories)),
          totalFollowers: followers,
          avgViews,
          engagementRate: er,
          basePrice: base,
          priceList: base
            ? JSON.stringify({ reel: base, story: Math.round(base * 0.4), video: Math.round(base * 1.6), post: Math.round(base * 0.8) })
            : null,
          gstStatus: gst,
          panNumber: r.panNumber || null,
          avatarColor: color,
          status,
          onboardingStep: status === "APPROVED" ? 4 : 1,
          ...(r.handle
            ? {
                socials: {
                  create: [
                    {
                      platform,
                      handle: r.handle,
                      url: `https://${platform.toLowerCase()}.com/${r.handle.replace("@", "")}`,
                      followers,
                      avgViews,
                      engagementRate: er,
                    },
                  ],
                },
              }
            : {}),
        },
      });
      created++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      errors.push({ row: rowNum, message: `Could not import "${r.name}" — ${msg}` });
      skipped++;
    }
  }

  revalidatePath("/creators");
  revalidatePath("/discovery");
  revalidatePath("/onboarding");
  revalidatePath("/");

  return {
    ok: true,
    created,
    skipped,
    total: rows.length,
    errors,
    message:
      created > 0
        ? `Imported ${created} creator${created === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`
        : "No creators were imported — check the errors below.",
  };
}

import { extname } from "node:path";
import * as XLSX from "xlsx";
import type { ParsedRecord, SourceConfiguration } from "./types";

function normalizedObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, cell]) => [key.trim(), cell] as const)
      .filter(([key]) => key.length > 0),
  );
}

function isEmptyRecord(record: Record<string, unknown>): boolean {
  return Object.values(record).every((value) => value === null || value === undefined || value === "");
}

function parseWorkbook(buffer: Buffer, source: SourceConfiguration): ParsedRecord[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, dense: true });
  const selectedSheets = source.sheetNames.length > 0
    ? source.sheetNames.filter((name) => workbook.SheetNames.includes(name))
    : workbook.SheetNames;

  const records: ParsedRecord[] = [];
  for (const sheetName of selectedSheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
      blankrows: false,
    });
    rows.forEach((row, index) => {
      const payload = normalizedObject(row);
      if (!isEmptyRecord(payload)) {
        records.push({ sheetName, rowNumber: index + 2, payload });
      }
    });
  }
  return records;
}

function parseJson(buffer: Buffer): ParsedRecord[] {
  const value = JSON.parse(buffer.toString("utf8")) as unknown;
  const rows = Array.isArray(value) ? value : [value];
  return rows.flatMap((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const payload = normalizedObject(row as Record<string, unknown>);
    return isEmptyRecord(payload) ? [] : [{ sheetName: null, rowNumber: index + 1, payload }];
  });
}

export function parseTabularFile(
  fileName: string,
  buffer: Buffer,
  source: SourceConfiguration,
): ParsedRecord[] {
  const extension = extname(fileName).toLowerCase();
  if ([".xlsx", ".xls", ".xlsb", ".csv"].includes(extension)) {
    return parseWorkbook(buffer, source);
  }
  if (extension === ".json") return parseJson(buffer);
  throw new Error(`Formato de arquivo não suportado para ingestão tabular: ${extension || fileName}`);
}

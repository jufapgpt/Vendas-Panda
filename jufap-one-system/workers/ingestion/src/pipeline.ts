import { createHash } from "node:crypto";
import { log } from "@jufap-one/core";
import type { SourceAdapter, SourceConfiguration } from "./types";
import { parseTabularFile } from "./parser";
import { IngestionStore, type RunTotals, type StagedRecord } from "./store";

function normalizedValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizedValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key.trim(), normalizedValue(nested)]),
    );
  }
  if (typeof value === "string") return value.trim();
  return value;
}

function missing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function validateRecord(
  payload: Record<string, unknown>,
  source: SourceConfiguration,
  sheetName: string | null,
  rowNumber: number,
): StagedRecord {
  const normalizedPayload = normalizedValue(payload) as Record<string, unknown>;
  const errors: string[] = [];

  for (const column of source.keyColumns) {
    if (missing(normalizedPayload[column])) errors.push(`Chave obrigatória ausente: ${column}`);
  }

  for (const column of source.dateColumns) {
    const value = normalizedPayload[column];
    if (missing(value)) {
      errors.push(`Data obrigatória ausente: ${column}`);
    } else if (Number.isNaN(new Date(String(value)).getTime())) {
      errors.push(`Data inválida em ${column}: ${String(value)}`);
    }
  }

  const recordKey = source.keyColumns.length > 0 && errors.length === 0
    ? source.keyColumns.map((column) => String(normalizedPayload[column])).join("|")
    : null;

  return {
    sheetName,
    rowNumber,
    recordKey,
    rawPayload: payload,
    normalizedPayload,
    validationState: errors.length === 0 ? "valid" : "rejected",
    validationErrors: errors,
  };
}

export interface PipelineResult extends RunTotals {
  sourceCode: string;
  runId: string;
  cursorAdvanced: boolean;
  errors: number;
}

export async function runSourcePipeline(
  source: SourceConfiguration,
  adapter: SourceAdapter,
  store: IngestionStore,
  maxFileBytes: number,
): Promise<PipelineResult> {
  const sourceId = await store.ensureSource(source);
  const cursorBefore = await store.getCursor(sourceId);
  const runId = await store.beginRun(sourceId, cursorBefore);
  const totals: RunTotals = {
    filesSeen: 0,
    filesProcessed: 0,
    rowsReceived: 0,
    rowsValid: 0,
    rowsRejected: 0,
  };
  let errors = 0;

  try {
    const changes = await adapter.listChanges(cursorBefore);
    totals.filesSeen = changes.files.length;

    for (const file of changes.files) {
      try {
        if (file.deleted) {
          await store.upsertFile(sourceId, runId, file, null);
          totals.filesProcessed += 1;
          continue;
        }

        if (file.sizeBytes !== null && file.sizeBytes > maxFileBytes) {
          throw new Error(`Arquivo excede o limite de ${maxFileBytes} bytes.`);
        }
        if (!await store.shouldProcess(sourceId, file)) continue;

        const buffer = await adapter.download(file);
        const contentHash = createHash("sha256").update(buffer).digest("hex");
        const parsed = parseTabularFile(file.name, buffer, source);
        const records = parsed.map((record) => validateRecord(
          record.payload,
          source,
          record.sheetName,
          record.rowNumber,
        ));
        const fileStateId = await store.upsertFile(sourceId, runId, file, contentHash);
        await store.replaceStagedRecords(runId, sourceId, fileStateId, records);

        totals.filesProcessed += 1;
        totals.rowsReceived += records.length;
        totals.rowsValid += records.filter((record) => record.validationState === "valid").length;
        totals.rowsRejected += records.filter((record) => record.validationState === "rejected").length;
        log("info", "source_file_processed", {
          service: "ingestion",
          sourceCode: source.code,
          path: file.path,
          rows: records.length,
        });
      } catch (error) {
        errors += 1;
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        await store.recordFileFailure(sourceId, file, normalizedError);
        log("error", "source_file_failed", {
          service: "ingestion",
          sourceCode: source.code,
          path: file.path,
          error: normalizedError.message,
        });
      }
    }

    const cursorAdvanced = errors === 0 && Boolean(changes.nextCursor);
    if (cursorAdvanced && changes.nextCursor) await store.saveCursor(sourceId, changes.nextCursor);
    await store.finishRun(
      runId,
      errors === 0 ? "completed" : "completed_with_errors",
      totals,
      cursorAdvanced ? changes.nextCursor : null,
    );
    return { sourceCode: source.code, runId, ...totals, cursorAdvanced, errors };
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    await store.finishRun(runId, "failed", totals, null, normalizedError.message.slice(0, 1000));
    throw normalizedError;
  }
}

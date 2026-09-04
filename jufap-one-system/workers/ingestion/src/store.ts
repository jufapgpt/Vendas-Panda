import { Pool, type PoolClient } from "pg";
import type { SourceConfiguration, SourceFile } from "./types";

export interface StagedRecord {
  sheetName: string | null;
  rowNumber: number;
  recordKey: string | null;
  rawPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  validationState: "valid" | "rejected";
  validationErrors: string[];
}

export interface RunTotals {
  filesSeen: number;
  filesProcessed: number;
  rowsReceived: number;
  rowsValid: number;
  rowsRejected: number;
}

export class IngestionStore {
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl, max: 5 });
  }

  async ensureSource(source: SourceConfiguration): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO dim_source (
         code, name, domain, operation, source_path, expected_grain, frequency,
         owner, sensitivity, status, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',now())
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         domain = EXCLUDED.domain,
         operation = EXCLUDED.operation,
         source_path = EXCLUDED.source_path,
         expected_grain = EXCLUDED.expected_grain,
         frequency = EXCLUDED.frequency,
         owner = EXCLUDED.owner,
         sensitivity = EXCLUDED.sensitivity,
         updated_at = now()
       RETURNING id::text`,
      [
        source.code,
        source.name,
        source.domain,
        source.operation,
        source.pathPrefix,
        source.expectedGrain,
        source.frequency,
        source.owner,
        source.sensitivity,
      ],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error(`Não foi possível registrar a fonte ${source.code}.`);
    return id;
  }

  async getCursor(sourceId: string): Promise<string | null> {
    const result = await this.pool.query<{ delta_link: string | null }>(
      "SELECT delta_link FROM source_cursor WHERE source_id = $1",
      [sourceId],
    );
    return result.rows[0]?.delta_link ?? null;
  }

  async saveCursor(sourceId: string, cursor: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO source_cursor (source_id, delta_link, last_seen_at, updated_at)
       VALUES ($1,$2,now(),now())
       ON CONFLICT (source_id) DO UPDATE SET
         delta_link = EXCLUDED.delta_link,
         last_seen_at = now(),
         updated_at = now()`,
      [sourceId, cursor],
    );
  }

  async beginRun(sourceId: string, cursorBefore: string | null): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO fact_ingestion_run (source_id, cursor_before, started_at, status)
       VALUES ($1,$2,now(),'running') RETURNING id::text`,
      [sourceId, cursorBefore],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error("Não foi possível iniciar a execução de ingestão.");
    return id;
  }

  async shouldProcess(sourceId: string, file: SourceFile): Promise<boolean> {
    if (file.deleted) return true;
    const result = await this.pool.query<{ etag: string | null; modified_at: string | null; size_bytes: string | null }>(
      `SELECT etag, modified_at::text, size_bytes::text
       FROM source_file_state WHERE source_id = $1 AND drive_item_id = $2`,
      [sourceId, file.id],
    );
    const existing = result.rows[0];
    if (!existing) return true;
    if (file.etag && existing.etag) return file.etag !== existing.etag;
    return existing.modified_at !== file.modifiedAt || Number(existing.size_bytes) !== file.sizeBytes;
  }

  async upsertFile(
    sourceId: string,
    runId: string,
    file: SourceFile,
    contentHash: string | null,
  ): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO source_file_state (
         source_id, drive_item_id, file_name, source_path, mime_type, size_bytes,
         etag, ctag, content_hash, modified_at, deleted_at, last_run_id, metadata, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         CASE WHEN $11::boolean THEN now() ELSE NULL END,$12,'{}'::jsonb,now()
       )
       ON CONFLICT (source_id, drive_item_id) DO UPDATE SET
         file_name = EXCLUDED.file_name,
         source_path = EXCLUDED.source_path,
         mime_type = EXCLUDED.mime_type,
         size_bytes = EXCLUDED.size_bytes,
         etag = EXCLUDED.etag,
         ctag = EXCLUDED.ctag,
         content_hash = COALESCE(EXCLUDED.content_hash, source_file_state.content_hash),
         modified_at = EXCLUDED.modified_at,
         deleted_at = EXCLUDED.deleted_at,
         last_run_id = EXCLUDED.last_run_id,
         updated_at = now()
       RETURNING id::text`,
      [
        sourceId,
        file.id,
        file.name,
        file.path,
        file.mimeType,
        file.sizeBytes,
        file.etag,
        file.ctag,
        contentHash,
        file.modifiedAt,
        file.deleted,
        runId,
      ],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error(`Não foi possível registrar o arquivo ${file.path}.`);
    return id;
  }

  async replaceStagedRecords(
    runId: string,
    sourceId: string,
    fileStateId: string,
    records: StagedRecord[],
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM staging_record WHERE file_state_id = $1", [fileStateId]);
      for (let start = 0; start < records.length; start += 500) {
        await this.insertBatch(client, runId, sourceId, fileStateId, records.slice(start, start + 500));
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertBatch(
    client: PoolClient,
    runId: string,
    sourceId: string,
    fileStateId: string,
    records: StagedRecord[],
  ): Promise<void> {
    if (records.length === 0) return;
    const payload = records.map((record) => ({
      sheet_name: record.sheetName,
      row_number: record.rowNumber,
      record_key: record.recordKey,
      raw_payload: record.rawPayload,
      normalized_payload: record.normalizedPayload,
      validation_state: record.validationState,
      validation_errors: record.validationErrors,
    }));
    await client.query(
      `INSERT INTO staging_record (
         run_id, source_id, file_state_id, sheet_name, row_number, record_key,
         raw_payload, normalized_payload, validation_state, validation_errors
       )
       SELECT $1::uuid, $2::uuid, $3::uuid, x.sheet_name, x.row_number, x.record_key,
         x.raw_payload, x.normalized_payload, x.validation_state, x.validation_errors
       FROM jsonb_to_recordset($4::jsonb) AS x(
         sheet_name text,
         row_number bigint,
         record_key text,
         raw_payload jsonb,
         normalized_payload jsonb,
         validation_state text,
         validation_errors jsonb
       )`,
      [runId, sourceId, fileStateId, JSON.stringify(payload)],
    );
  }

  async recordFileFailure(
    sourceId: string,
    file: SourceFile,
    error: Error,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO fact_quality_issue (
         source_id, category, title, description, record_count, financial_impact,
         severity, status, owner, evidence
       ) VALUES (
         $1,'source_schema',$2,$3,1,0,'high','open','BI / Dados',$4::jsonb
       )`,
      [
        sourceId,
        `Falha de ingestão: ${file.name}`,
        error.message.slice(0, 1000),
        JSON.stringify({ driveItemId: file.id, path: file.path, etag: file.etag }),
      ],
    );
  }

  async finishRun(
    runId: string,
    status: "completed" | "completed_with_errors" | "failed",
    totals: RunTotals,
    cursorAfter: string | null,
    errorMessage: string | null = null,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE fact_ingestion_run SET
         cursor_after = $2,
         finished_at = now(),
         status = $3,
         files_seen = $4,
         files_processed = $5,
         rows_received = $6,
         rows_valid = $7,
         rows_rejected = $8,
         error_message = $9
       WHERE id = $1`,
      [
        runId,
        cursorAfter,
        status,
        totals.filesSeen,
        totals.filesProcessed,
        totals.rowsReceived,
        totals.rowsValid,
        totals.rowsRejected,
        errorMessage,
      ],
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { log, metricRegistry } from "@jufap-one/core";
import { z } from "zod";
import { reconcile, type ReconciliationInput } from "./reconciliation";

const ConfigSchema = z.object({
  METRICS_MODE: z.enum(["disabled", "sync", "reconcile", "all"]).default("disabled"),
  DATABASE_URL: z.string().default("postgres://jufap_one:jufap_one@localhost:5432/jufap_one"),
  RECONCILIATION_INPUT: z.string().optional(),
});

const ReconciliationFileSchema = z.object({
  records: z.array(z.object({
    indicatorCode: z.string().min(1),
    referenceDate: z.iso.date(),
    scopeType: z.string().min(1),
    scopeId: z.string().nullable(),
    baselineSource: z.string().min(1),
    baselineValue: z.number(),
    candidateValue: z.number(),
    toleranceAbsolute: z.number().nonnegative().default(0),
    toleranceRelative: z.number().nonnegative().default(0),
    details: z.record(z.string(), z.unknown()).optional(),
  })),
});

async function syncMetricRegistry(pool: Pool): Promise<void> {
  for (const metric of metricRegistry) {
    await pool.query(
      `INSERT INTO dim_indicator (
         code, version, label, domain, operation, unit, direction, description,
         original_measure, original_dax, canonical_formula, lifecycle, metadata, updated_at
       ) VALUES ($1,1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,now())
       ON CONFLICT (code, version) DO UPDATE SET
         label = EXCLUDED.label,
         domain = EXCLUDED.domain,
         operation = EXCLUDED.operation,
         unit = EXCLUDED.unit,
         direction = EXCLUDED.direction,
         description = EXCLUDED.description,
         canonical_formula = EXCLUDED.canonical_formula,
         metadata = EXCLUDED.metadata,
         updated_at = now()`,
      [
        metric.code,
        metric.label,
        metric.domain,
        metric.operation,
        metric.unit,
        metric.direction,
        metric.description,
        metric.originalPowerBiMeasure,
        metric.originalDax,
        metric.canonicalFormula,
        metric.lifecycle,
        JSON.stringify({ dependencies: metric.dependencies }),
      ],
    );
  }

  const draftCount = metricRegistry.filter((metric) => metric.lifecycle === "draft").length;
  const missingDax = metricRegistry.filter((metric) => !metric.originalDax).length;
  log("info", "metric_registry_synced", {
    service: "metrics",
    total: metricRegistry.length,
    draftCount,
    missingOriginalDax: missingDax,
  });
}

async function loadReconciliationInput(path: string): Promise<ReconciliationInput[]> {
  const absolutePath = resolve(process.cwd(), path);
  const parsed = ReconciliationFileSchema.safeParse(
    JSON.parse(await readFile(absolutePath, "utf8")) as unknown,
  );
  if (!parsed.success) {
    throw new Error(`Arquivo de reconciliação inválido: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data.records;
}

async function saveReconciliations(pool: Pool, inputs: ReconciliationInput[]): Promise<void> {
  for (const input of inputs) {
    const result = reconcile(input);
    const indicator = await pool.query<{ id: string }>(
      `SELECT id::text FROM dim_indicator
       WHERE code = $1 AND valid_to IS NULL
       ORDER BY version DESC LIMIT 1`,
      [input.indicatorCode],
    );
    const indicatorId = indicator.rows[0]?.id;
    if (!indicatorId) throw new Error(`Indicador não cadastrado: ${input.indicatorCode}`);

    await pool.query(
      `INSERT INTO fact_reconciliation (
         indicator_id, reference_date, scope_type, scope_id, baseline_source,
         baseline_value, candidate_value, absolute_difference, relative_difference,
         tolerance_absolute, tolerance_relative, status, details
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
      [
        indicatorId,
        result.referenceDate,
        result.scopeType,
        result.scopeId,
        result.baselineSource,
        result.baselineValue,
        result.candidateValue,
        result.absoluteDifference,
        result.relativeDifference,
        result.toleranceAbsolute,
        result.toleranceRelative,
        result.status,
        JSON.stringify(result.details ?? {}),
      ],
    );
  }

  const divergent = inputs.map(reconcile).filter((result) => result.status === "divergent").length;
  log("info", "reconciliation_completed", {
    service: "metrics",
    total: inputs.length,
    divergent,
  });
}

async function main(): Promise<void> {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(z.prettifyError(parsed.error));
  const config = parsed.data;

  if (config.METRICS_MODE === "disabled") {
    log("info", "metrics_worker_disabled", {
      service: "metrics",
      message: "Ative após a primeira migração do banco ou durante a reconciliação das fórmulas.",
    });
    return;
  }

  const pool = new Pool({ connectionString: config.DATABASE_URL, max: 3 });
  try {
    if (config.METRICS_MODE === "sync" || config.METRICS_MODE === "all") {
      await syncMetricRegistry(pool);
    }
    if (config.METRICS_MODE === "reconcile" || config.METRICS_MODE === "all") {
      if (!config.RECONCILIATION_INPUT) {
        throw new Error("RECONCILIATION_INPUT é obrigatório no modo de reconciliação.");
      }
      await saveReconciliations(pool, await loadReconciliationInput(config.RECONCILIATION_INPUT));
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  log("error", "metrics_worker_failed", {
    service: "metrics",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});

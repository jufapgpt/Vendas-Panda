import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import type { SourceConfiguration } from "./types";

const EnvironmentSchema = z.object({
  INGESTION_MODE: z.enum(["disabled", "local", "graph"]).default("disabled"),
  DATABASE_URL: z.string().default("postgres://jufap_one:jufap_one@localhost:5432/jufap_one"),
  SOURCE_CONFIG_PATH: z.string().default("config/sources.stage2.example.json"),
  SOURCE_CODE: z.string().min(1).optional(),
  LOCAL_SOURCE_ROOT: z.string().default("./local-sources"),
  MAX_SOURCE_FILE_BYTES: z.coerce.number().int().positive().default(250_000_000),
  ONEDRIVE_TENANT_ID: z.string().optional(),
  ONEDRIVE_CLIENT_ID: z.string().optional(),
  ONEDRIVE_CLIENT_SECRET: z.string().optional(),
  ONEDRIVE_DRIVE_ID: z.string().optional(),
});

const SourceConfigurationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  operation: z.string().nullable(),
  pathPrefix: z.string(),
  filePattern: z.string().default("*.xlsx"),
  sheetNames: z.array(z.string()).default([]),
  expectedGrain: z.string().min(1),
  keyColumns: z.array(z.string()).default([]),
  dateColumns: z.array(z.string()).default([]),
  frequency: z.enum(["intraday", "daily", "weekly", "monthly", "on_demand"]),
  owner: z.string().nullable(),
  sensitivity: z.enum(["public", "internal", "restricted"]),
  enabled: z.boolean().default(false),
});

const SourceFileSchema = z.object({
  sources: z.array(SourceConfigurationSchema),
});

export type IngestionConfig = z.infer<typeof EnvironmentSchema>;

export function loadIngestionConfig(environment: NodeJS.ProcessEnv = process.env): IngestionConfig {
  const parsed = EnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(`Configuração de ingestão inválida: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export async function loadSourceConfigurations(
  configPath: string,
  sourceCode?: string,
): Promise<SourceConfiguration[]> {
  const absolutePath = resolve(process.cwd(), configPath);
  const payload = JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
  const parsed = SourceFileSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Catálogo de fontes inválido em ${absolutePath}: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data.sources
    .filter((source) => source.enabled)
    .filter((source) => !sourceCode || source.code === sourceCode);
}

export function requireGraphSettings(config: IngestionConfig): {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  driveId: string;
} {
  const values = {
    tenantId: config.ONEDRIVE_TENANT_ID,
    clientId: config.ONEDRIVE_CLIENT_ID,
    clientSecret: config.ONEDRIVE_CLIENT_SECRET,
    driveId: config.ONEDRIVE_DRIVE_ID,
  };
  const missing = Object.entries(values).filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Configuração Microsoft Graph incompleta: ${missing.join(", ")}.`);
  }
  return values as { tenantId: string; clientId: string; clientSecret: string; driveId: string };
}

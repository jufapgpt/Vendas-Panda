import { log } from "@jufap-one/core";
import { createSourceAdapter } from "./adapters";
import { loadIngestionConfig, loadSourceConfigurations } from "./config";
import { runSourcePipeline } from "./pipeline";
import { IngestionStore } from "./store";

async function main(): Promise<void> {
  const config = loadIngestionConfig();
  if (config.INGESTION_MODE === "disabled") {
    log("info", "ingestion_disabled", {
      service: "ingestion",
      message: "A fundação está pronta. Ative a integração somente após cadastrar os caminhos oficiais.",
    });
    return;
  }

  const sources = await loadSourceConfigurations(config.SOURCE_CONFIG_PATH, config.SOURCE_CODE);
  if (sources.length === 0) {
    log("warn", "no_enabled_sources", {
      service: "ingestion",
      configPath: config.SOURCE_CONFIG_PATH,
      sourceCode: config.SOURCE_CODE ?? null,
    });
    return;
  }

  const store = new IngestionStore(config.DATABASE_URL);
  try {
    for (const source of sources) {
      const adapter = createSourceAdapter(config, source);
      const result = await runSourcePipeline(source, adapter, store, config.MAX_SOURCE_FILE_BYTES);
      log("info", "source_ingestion_completed", { service: "ingestion", ...result });
    }
  } finally {
    await store.close();
  }
}

main().catch((error) => {
  log("error", "ingestion_failed", {
    service: "ingestion",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});

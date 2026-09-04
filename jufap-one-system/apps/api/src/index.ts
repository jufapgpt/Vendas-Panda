import { log } from "@jufap-one/core";
import { loadConfig } from "./config";
import { buildServer } from "./server";

const config = loadConfig();
const app = await buildServer(config);

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
  log("info", "api_started", {
    service: "api",
    host: config.API_HOST,
    port: config.API_PORT,
    dataMode: config.DATA_MODE,
    authMode: config.AUTH_MODE,
  });
} catch (error) {
  log("error", "api_start_failed", {
    service: "api",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
}

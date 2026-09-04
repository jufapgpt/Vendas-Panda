import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATA_MODE: z.enum(["mock", "database"]).default("mock"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("postgres://jufap_one:jufap_one@localhost:5432/jufap_one"),
  AUTH_MODE: z.enum(["mock", "entra"]).default("mock"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = ConfigSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(`Configuração inválida: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

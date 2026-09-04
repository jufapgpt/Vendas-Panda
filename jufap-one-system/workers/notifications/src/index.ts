import { log } from "@jufap-one/core";
import { z } from "zod";

const ConfigSchema = z.object({
  BRIEF_MODE: z.enum(["disabled", "stdout", "webhook"]).default("disabled"),
  API_INTERNAL_URL: z.string().url().default("http://localhost:4000"),
  BRIEF_WEBHOOK_URL: z.string().url().optional(),
  BRIEF_PERIOD: z.enum(["today", "yesterday", "month", "closing"]).default("today"),
  BRIEF_SCOPE_TYPE: z.enum(["group", "company", "regional", "coordinator", "store"]).default("group"),
  BRIEF_SCOPE_ID: z.string().optional(),
});

interface BriefPayload {
  data: {
    subject: string;
    generatedAt: string;
    scope: string;
    narrative: Record<string, unknown>;
    kpis: unknown[];
    priorityActions: unknown[];
  };
}

async function fetchBrief(config: z.infer<typeof ConfigSchema>): Promise<BriefPayload> {
  const query = new URLSearchParams({
    period: config.BRIEF_PERIOD,
    scopeType: config.BRIEF_SCOPE_TYPE,
    indicator: "TIM_REVENUE",
  });
  if (config.BRIEF_SCOPE_ID) query.set("scopeId", config.BRIEF_SCOPE_ID);

  const response = await fetch(`${config.API_INTERNAL_URL}/v1/brief?${query}`, {
    headers: {
      "x-user-email": "jufap-brief@grupojufap.com.br",
      "x-user-name": "JUFAP Brief",
      "x-user-role": "director",
    },
  });
  if (!response.ok) throw new Error(`API do JUFAP One respondeu ${response.status}.`);
  return response.json() as Promise<BriefPayload>;
}

async function main(): Promise<void> {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(z.prettifyError(parsed.error));
  const config = parsed.data;

  if (config.BRIEF_MODE === "disabled") {
    log("info", "brief_worker_disabled", {
      service: "notifications",
      message: "O canal de envio será ativado após a conexão dos dados e definição dos destinatários.",
    });
    return;
  }

  const payload = await fetchBrief(config);
  if (config.BRIEF_MODE === "stdout") {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (!config.BRIEF_WEBHOOK_URL) throw new Error("BRIEF_WEBHOOK_URL é obrigatório no modo webhook.");
  const response = await fetch(config.BRIEF_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Webhook do JUFAP Brief respondeu ${response.status}.`);
  log("info", "brief_sent", {
    service: "notifications",
    scope: payload.data.scope,
    subject: payload.data.subject,
  });
}

main().catch((error) => {
  log("error", "brief_worker_failed", {
    service: "notifications",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});

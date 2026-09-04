import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  ActionUpdateSchema,
  DashboardFiltersSchema,
  DashboardOverviewResponseSchema,
  assertPermission,
  canAccessScope,
} from "@jufap-one/core";
import type { AppConfig } from "./config";
import { resolveUser } from "./auth";
import type { JufapRepository } from "./repository";

export async function registerRoutes(
  app: FastifyInstance,
  repository: JufapRepository,
  config: AppConfig,
): Promise<void> {
  app.get("/health/live", async () => ({ status: "ok", service: "jufap-one-api" }));
  app.get("/health/ready", async (_request, reply) => {
    const ready = await repository.ready();
    return reply.code(ready ? 200 : 503).send({ status: ready ? "ready" : "not_ready" });
  });

  app.get("/v1/dashboard/overview", async (request, reply) => {
    const parsed = DashboardFiltersSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_filters", details: parsed.error.issues });
    const user = resolveUser(request, config);
    assertPermission(user, "overview:read");
    const requestedScope = {
      type: parsed.data.scopeType,
      ...(parsed.data.scopeId ? { id: parsed.data.scopeId } : {}),
    } as const;
    if (!canAccessScope(user, requestedScope)) return reply.code(403).send({ error: "scope_denied" });

    const data = await repository.getOverview(parsed.data, user);
    const payload = DashboardOverviewResponseSchema.parse({
      data,
      meta: {
        requestId: request.id || randomUUID(),
        generatedAt: new Date().toISOString(),
        dataMode: config.DATA_MODE,
      },
    });
    return payload;
  });

  app.get<{ Params: { storeId: string } }>("/v1/stores/:storeId", async (request, reply) => {
    const user = resolveUser(request, config);
    assertPermission(user, "store:read");
    const store = await repository.getStore(request.params.storeId, user);
    if (!store) return reply.code(404).send({ error: "store_not_found" });
    return { data: store };
  });

  app.get("/v1/actions", async (request) => {
    const user = resolveUser(request, config);
    assertPermission(user, "action:read");
    return { data: await repository.listActions(user) };
  });

  app.patch<{ Params: { actionId: string } }>("/v1/actions/:actionId", async (request, reply) => {
    const user = resolveUser(request, config);
    assertPermission(user, "action:manage");
    const parsed = ActionUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_action", details: parsed.error.issues });
    const action = await repository.updateAction(request.params.actionId, parsed.data, user);
    if (!action) return reply.code(404).send({ error: "action_not_found" });
    return { data: action };
  });

  app.get("/v1/sources", async (request) => {
    const user = resolveUser(request, config);
    assertPermission(user, "source:read");
    return { data: await repository.listSources(user) };
  });

  app.get("/v1/metrics", async (request) => {
    const user = resolveUser(request, config);
    assertPermission(user, "metric:read");
    return { data: await repository.listMetrics(user) };
  });

  app.get("/v1/brief", async (request) => {
    const parsed = DashboardFiltersSchema.safeParse(request.query);
    if (!parsed.success) return { error: "invalid_filters", details: parsed.error.issues };
    const user = resolveUser(request, config);
    assertPermission(user, "brief:read");
    const overview = await repository.getOverview(parsed.data, user);
    return {
      data: {
        subject: `JUFAP Brief · ${overview.narrative.headline}`,
        generatedAt: new Date().toISOString(),
        scope: overview.scopeLabel,
        narrative: overview.narrative,
        kpis: overview.kpis,
        priorityActions: overview.actions.filter((action) => action.status !== "done").slice(0, 5),
      },
    };
  });
}

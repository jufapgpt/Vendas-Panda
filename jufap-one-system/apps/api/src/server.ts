import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { log } from "@jufap-one/core";
import type { AppConfig } from "./config";
import { MockRepository } from "./mock-repository";
import { PostgresRepository } from "./postgres-repository";
import type { JufapRepository } from "./repository";
import { registerRoutes } from "./routes";

function repositoryFor(config: AppConfig): JufapRepository {
  return config.DATA_MODE === "database"
    ? new PostgresRepository(config.DATABASE_URL)
    : new MockRepository();
}

export async function buildServer(config: AppConfig): Promise<FastifyInstance> {
  const repository = repositoryFor(config);
  const app = Fastify({
    logger: false,
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
  });

  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true,
  });

  app.addHook("onResponse", async (request, reply) => {
    log("info", "http_request", {
      service: "api",
      requestId: request.id,
      method: request.method,
      path: request.url,
      statusCode: reply.statusCode,
      responseTimeMs: Math.round(reply.elapsedTime),
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const unauthorized = normalizedError.name === "UnauthorizedError";
    const forbidden = normalizedError.message.startsWith("Permissão negada");
    log("error", normalizedError.message, {
      service: "api",
      requestId: request.id,
      stack: config.NODE_ENV === "production" ? undefined : normalizedError.stack,
    });
    reply.code(unauthorized ? 401 : forbidden ? 403 : 500).send({
      error: unauthorized ? "unauthorized" : forbidden ? "forbidden" : "internal_error",
      message: unauthorized || forbidden ? normalizedError.message : "Falha interna ao processar a solicitação.",
      requestId: request.id,
    });
  });

  app.addHook("onClose", async () => repository.close());
  await registerRoutes(app, repository, config);
  return app;
}

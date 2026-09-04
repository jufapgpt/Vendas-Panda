import type { FastifyRequest } from "fastify";
import {
  ScopeSchema,
  type Role,
  type Scope,
  type UserContext,
} from "@jufap-one/core";
import type { AppConfig } from "./config";

function header(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function parseRole(value: string | undefined): Role {
  const allowed: Role[] = [
    "director",
    "area_director",
    "regional",
    "coordinator",
    "manager",
    "controller",
    "finance",
    "hr",
    "purchasing",
    "viewer",
    "service",
  ];
  return allowed.includes(value as Role) ? (value as Role) : "director";
}

function parseScope(request: FastifyRequest): Scope {
  const parsed = ScopeSchema.safeParse({
    type: header(request, "x-scope-type") ?? "group",
    id: header(request, "x-scope-id"),
    label: header(request, "x-scope-label"),
  });
  return parsed.success ? parsed.data : { type: "group" };
}

export function resolveUser(request: FastifyRequest, config: AppConfig): UserContext {
  if (config.AUTH_MODE === "entra") {
    const email = header(request, "x-ms-client-principal-name") ?? header(request, "x-user-email");
    if (!email) {
      const error = new Error("Sessão corporativa ausente.");
      error.name = "UnauthorizedError";
      throw error;
    }

    return {
      id: header(request, "x-ms-client-principal-id") ?? email,
      email,
      name: header(request, "x-user-name") ?? email,
      role: parseRole(header(request, "x-user-role")),
      scopes: [parseScope(request)],
    };
  }

  const email = header(request, "x-user-email") ?? "diretoria@grupojufap.com.br";
  return {
    id: email,
    email,
    name: header(request, "x-user-name") ?? "Diretoria JUFAP",
    role: parseRole(header(request, "x-user-role")),
    scopes: [parseScope(request)],
  };
}

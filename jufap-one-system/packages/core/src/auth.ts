import type { Scope, ScopeType } from "./contracts";

export const roles = [
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
] as const;

export type Role = (typeof roles)[number];

export const permissions = [
  "overview:read",
  "store:read",
  "seller:read",
  "quality:read",
  "quality:manage",
  "action:read",
  "action:manage",
  "source:read",
  "source:manage",
  "metric:read",
  "metric:manage",
  "brief:read",
  "brief:manage",
  "admin:access",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  director: permissions,
  area_director: [
    "overview:read",
    "store:read",
    "seller:read",
    "quality:read",
    "action:read",
    "action:manage",
    "source:read",
    "metric:read",
    "brief:read",
  ],
  regional: [
    "overview:read",
    "store:read",
    "seller:read",
    "quality:read",
    "action:read",
    "action:manage",
    "brief:read",
  ],
  coordinator: [
    "overview:read",
    "store:read",
    "seller:read",
    "quality:read",
    "action:read",
    "action:manage",
    "brief:read",
  ],
  manager: ["overview:read", "store:read", "seller:read", "quality:read", "action:read", "action:manage", "brief:read"],
  controller: [
    "overview:read",
    "store:read",
    "quality:read",
    "quality:manage",
    "action:read",
    "action:manage",
    "source:read",
    "metric:read",
    "brief:read",
  ],
  finance: ["overview:read", "store:read", "quality:read", "action:read", "action:manage", "metric:read", "brief:read"],
  hr: ["overview:read", "store:read", "quality:read", "action:read", "action:manage", "brief:read"],
  purchasing: ["overview:read", "store:read", "quality:read", "action:read", "action:manage", "brief:read"],
  viewer: ["overview:read", "store:read", "quality:read", "action:read", "brief:read"],
  service: ["source:read", "source:manage", "metric:read", "quality:read", "quality:manage"],
};

const scopeRank: Record<ScopeType, number> = {
  group: 5,
  company: 4,
  regional: 3,
  coordinator: 2,
  store: 1,
};

export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: Role;
  scopes: Scope[];
}

export function hasPermission(user: UserContext, permission: Permission): boolean {
  return rolePermissions[user.role].includes(permission);
}

export function canAccessScope(user: UserContext, requested: Scope): boolean {
  if (user.role === "director" || user.role === "service") return true;

  return user.scopes.some((granted) => {
    if (granted.type === "group") return true;
    if (granted.type === requested.type) return granted.id === requested.id;
    if (scopeRank[granted.type] <= scopeRank[requested.type]) return false;

    // O vínculo hierárquico real será resolvido pela dimensão organizacional.
    // Até a conexão da base mestre, escopos descendentes precisam ser explicitamente concedidos.
    return false;
  });
}

export function assertPermission(user: UserContext, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permissão negada: ${permission}`);
  }
}

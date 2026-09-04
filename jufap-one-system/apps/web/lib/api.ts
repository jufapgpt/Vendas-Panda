import {
  DashboardOverviewResponseSchema,
  type ActionPlan,
  type DashboardFilters,
  type DashboardOverviewResponse,
} from "@jufap-one/core";
import { fallbackResponse } from "./fallback";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function queryString(filters: DashboardFilters): string {
  const query = new URLSearchParams();
  query.set("period", filters.period);
  query.set("scopeType", filters.scopeType);
  query.set("indicator", filters.indicator);
  if (filters.scopeId) query.set("scopeId", filters.scopeId);
  if (filters.dateFrom) query.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) query.set("dateTo", filters.dateTo);
  return query.toString();
}

const mockHeaders = {
  "x-user-email": "diretoria@grupojufap.com.br",
  "x-user-name": "Diretoria JUFAP",
  "x-user-role": "director",
};

export async function fetchOverview(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<{ response: DashboardOverviewResponse; warning: string | null }> {
  try {
    const requestInit: RequestInit = { headers: mockHeaders, cache: "no-store" };
    if (signal) requestInit.signal = signal;
    const response = await fetch(`${apiUrl}/v1/dashboard/overview?${queryString(filters)}`, requestInit);
    if (!response.ok) throw new Error(`API respondeu ${response.status}`);
    const parsed = DashboardOverviewResponseSchema.parse(await response.json());
    return { response: parsed, warning: null };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      response: {
        ...fallbackResponse,
        data: { ...fallbackResponse.data, filters },
      },
      warning: "API indisponível: exibindo a base demonstrativa até a conexão oficial.",
    };
  }
}

export async function updateAction(actionId: string, status: ActionPlan["status"]): Promise<void> {
  const response = await fetch(`${apiUrl}/v1/actions/${actionId}`, {
    method: "PATCH",
    headers: { ...mockHeaders, "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Não foi possível atualizar a ação.");
}

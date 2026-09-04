import {
  DashboardOverviewResponseSchema,
  type ActionPlan,
  type DashboardFilters,
  type DashboardOverviewResponse,
  type MetricSnapshot,
  type Severity,
  type StoreSummary,
} from "@jufap-one/core";
import { fallbackResponse } from "./fallback";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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

interface PeriodProfile {
  valueFactor: number;
  goalFactor: number;
  trendFactor: number;
  remainingDays: number;
}

const periodProfiles: Record<Exclude<DashboardFilters["period"], "custom">, PeriodProfile> = {
  today: { valueFactor: 0.034, goalFactor: 0.033, trendFactor: 0.034, remainingDays: 1 },
  yesterday: { valueFactor: 0.043, goalFactor: 0.033, trendFactor: 0.043, remainingDays: 0 },
  tomorrow: { valueFactor: 0, goalFactor: 0.033, trendFactor: 0.034, remainingDays: 1 },
  month: { valueFactor: 1, goalFactor: 1, trendFactor: 1, remainingDays: 18 },
  closing: { valueFactor: 1.03, goalFactor: 1, trendFactor: 1.03, remainingDays: 0 },
};

function customProfile(filters: DashboardFilters): PeriodProfile {
  if (!filters.dateFrom || !filters.dateTo) {
    return { valueFactor: 0.35, goalFactor: 0.35, trendFactor: 0.36, remainingDays: 12 };
  }

  const start = new Date(`${filters.dateFrom}T00:00:00.000Z`);
  const end = new Date(`${filters.dateTo}T00:00:00.000Z`);
  const millisecondsPerDay = 86_400_000;
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1);
  const factor = Math.min(1, days / 30);
  return {
    valueFactor: factor * 0.97,
    goalFactor: factor,
    trendFactor: factor,
    remainingDays: Math.max(0, 30 - days),
  };
}

function profileFor(filters: DashboardFilters): PeriodProfile {
  return filters.period === "custom" ? customProfile(filters) : periodProfiles[filters.period];
}

function selectedStores(filters: DashboardFilters): StoreSummary[] {
  const stores = fallbackResponse.data.stores;
  if (!filters.scopeId || filters.scopeType === "group") return stores;
  if (filters.scopeType === "regional") {
    return stores.filter((store) => store.regional === filters.scopeId);
  }
  if (filters.scopeType === "store") {
    return stores.filter((store) => store.id === filters.scopeId || store.code === filters.scopeId);
  }
  return stores;
}

function scopeLabel(filters: DashboardFilters, stores: StoreSummary[]): string {
  if (!filters.scopeId || filters.scopeType === "group") return "Grupo JUFAP · Todas as lojas";
  if (filters.scopeType === "regional") return `Regional ${filters.scopeId} · ${stores.length} lojas demonstrativas`;
  if (filters.scopeType === "store") return stores[0] ? `${stores[0].code} · ${stores[0].name}` : "Loja não encontrada";
  return `${filters.scopeType} · ${filters.scopeId}`;
}

function severityFromAchievement(achievement: number | null): Severity {
  if (achievement === null) return "neutral";
  if (achievement >= 1) return "positive";
  if (achievement >= 0.9) return "attention";
  return "critical";
}

function scaleNumber(value: number, factor: number, unit: MetricSnapshot["unit"]): number {
  const scaled = value * factor;
  if (unit === "count" || unit === "days" || unit === "hours") return Math.round(scaled);
  return Math.round(scaled * 100) / 100;
}

function recalculateMetric(
  metric: MetricSnapshot,
  scopeFactor: number,
  filters: DashboardFilters,
  stores: StoreSummary[],
): MetricSnapshot {
  if (metric.code === "STORES_ATTENTION") {
    const value = stores.filter((store) => store.classification !== "highlight").length;
    return {
      ...metric,
      value,
      goal: null,
      achievement: null,
      trend: null,
      trendAchievement: null,
      gap: null,
      neededPerDay: null,
      severity: value === 0 ? "positive" : value <= 2 ? "attention" : "critical",
    };
  }

  const profile = profileFor(filters);
  const value = scaleNumber(metric.value, scopeFactor * profile.valueFactor, metric.unit);
  const goal = metric.goal === null
    ? null
    : scaleNumber(metric.goal, scopeFactor * profile.goalFactor, metric.unit);
  const trend = metric.trend === null
    ? null
    : scaleNumber(metric.trend, scopeFactor * profile.trendFactor, metric.unit);
  const achievement = goal && goal !== 0 ? value / goal : null;
  const trendAchievement = goal && goal !== 0 && trend !== null ? trend / goal : null;
  const gap = goal === null ? null : (trend ?? value) - goal;
  const neededPerDay = goal === null || profile.remainingDays <= 0
    ? null
    : Math.max(0, goal - value) / profile.remainingDays;

  return {
    ...metric,
    value,
    goal,
    achievement,
    trend,
    trendAchievement,
    gap,
    neededPerDay,
    severity: severityFromAchievement(trendAchievement ?? achievement),
  };
}

function filterActions(filters: DashboardFilters, stores: StoreSummary[]): ActionPlan[] {
  if (!filters.scopeId || filters.scopeType === "group") return fallbackResponse.data.actions;
  const storeIds = new Set(stores.map((store) => store.id));

  if (filters.scopeType === "regional") {
    return fallbackResponse.data.actions.filter((action) =>
      action.scope.type === "group" ||
      (action.scope.type === "regional" && action.scope.id === filters.scopeId) ||
      (action.scope.type === "store" && action.scope.id !== undefined && storeIds.has(action.scope.id)),
    );
  }

  if (filters.scopeType === "store") {
    return fallbackResponse.data.actions.filter((action) =>
      action.scope.type === "store" && action.scope.id === filters.scopeId,
    );
  }

  return fallbackResponse.data.actions;
}

function demoResponse(filters: DashboardFilters): DashboardOverviewResponse {
  const stores = selectedStores(filters);
  const allHealth = fallbackResponse.data.stores.reduce((sum, store) => sum + store.healthScore, 0);
  const selectedHealth = stores.reduce((sum, store) => sum + store.healthScore, 0);
  const scopeFactor = filters.scopeType === "group" || !filters.scopeId
    ? 1
    : allHealth > 0 ? selectedHealth / allHealth : 0;

  const storeIds = new Set(stores.map((store) => store.id));
  const qualityIssues = filters.scopeType === "group" || !filters.scopeId
    ? fallbackResponse.data.qualityIssues
    : fallbackResponse.data.qualityIssues.filter((issue) => {
        if (filters.scopeType === "store") return issue.storeId === filters.scopeId;
        return issue.regional === filters.scopeId || (issue.storeId !== null && storeIds.has(issue.storeId));
      });

  const pendingRecords = qualityIssues.reduce((sum, issue) => sum + issue.count, 0);
  const pendingValue = qualityIssues.reduce((sum, issue) => sum + issue.financialImpact, 0);
  const qualityScore = stores.length > 0
    ? stores.reduce((sum, store) => sum + store.qualityScore, 0) / stores.length
    : fallbackResponse.data.quality.score;

  const rhythm = filters.period === "today"
    ? fallbackResponse.data.rhythm.slice(-1)
    : filters.period === "yesterday"
      ? fallbackResponse.data.rhythm.slice(-2, -1)
      : filters.period === "tomorrow"
        ? [{ label: "Amanhã", current: 0, goal: 14330 * scopeFactor, previous: 0 }]
        : filters.period === "custom"
          ? fallbackResponse.data.rhythm.slice(-4)
          : fallbackResponse.data.rhythm;

  return {
    ...fallbackResponse,
    meta: {
      ...fallbackResponse.meta,
      requestId: `demo-${filters.period}-${filters.scopeType}-${filters.scopeId ?? "all"}`,
      generatedAt: new Date().toISOString(),
      dataMode: "mock",
    },
    data: {
      ...fallbackResponse.data,
      filters,
      scopeLabel: scopeLabel(filters, stores),
      stores,
      kpis: fallbackResponse.data.kpis.map((metric) => recalculateMetric(metric, scopeFactor, filters, stores)),
      indicatorStrip: fallbackResponse.data.indicatorStrip.map((metric) => recalculateMetric(metric, scopeFactor, filters, stores)),
      rhythm,
      quality: {
        ...fallbackResponse.data.quality,
        score: qualityScore,
        pendingRecords,
        pendingValue,
        state: pendingRecords === 0 ? "consolidated" : qualityScore >= 0.95 ? "warning" : "unreliable",
        message: pendingRecords === 0
          ? "Nenhuma ocorrência demonstrativa no escopo selecionado."
          : `${(qualityScore * 100).toFixed(1).replace(".", ",")}% de qualidade; ${pendingRecords} ocorrências demonstrativas no escopo.`,
      },
      qualityIssues,
      actions: filterActions(filters, stores),
      narrative: {
        ...fallbackResponse.data.narrative,
        summary: `${scopeLabel(filters, stores)}. Os filtros estão sendo aplicados sobre a base demonstrativa. Os valores oficiais entrarão após a conexão e a reconciliação das fontes.`,
      },
    },
  };
}

export async function fetchOverview(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<{ response: DashboardOverviewResponse; warning: string | null }> {
  if (demoMode) {
    return {
      response: demoResponse(filters),
      warning: "Prévia interativa: os filtros funcionam sobre dados demonstrativos. A validação das fórmulas oficiais depende das bases do OneDrive e da reconciliação com o Power BI.",
    };
  }

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
      response: demoResponse(filters),
      warning: "API indisponível: exibindo a prévia interativa com dados demonstrativos.",
    };
  }
}

export async function updateAction(actionId: string, status: ActionPlan["status"]): Promise<void> {
  if (demoMode) return;

  const response = await fetch(`${apiUrl}/v1/actions/${actionId}`, {
    method: "PATCH",
    headers: { ...mockHeaders, "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Não foi possível atualizar a ação.");
}

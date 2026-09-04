import {
  calculateAchievement,
  calculateGap,
  calculateNeededPerDay,
  classifyAchievement,
  metricRegistry,
  sourceCatalog,
  type ActionPlan,
  type DashboardFilters,
  type DashboardOverview,
  type DataQuality,
  type MetricSnapshot,
  type StoreSummary,
} from "@jufap-one/core";

const FIXED_NOW = "2026-09-04T11:30:00.000Z";

const quality: DataQuality = {
  score: 0.974,
  state: "warning",
  pendingRecords: 27,
  pendingValue: 18400,
  updatedAt: FIXED_NOW,
  message: "97,4% dos registros estão relacionados; 27 ocorrências aguardam tratamento.",
};

function metric(
  code: string,
  label: string,
  unit: MetricSnapshot["unit"],
  value: number,
  goal: number,
  trend: number,
  comparison: number,
): MetricSnapshot {
  const achievement = calculateAchievement(value, goal);
  const trendAchievement = calculateAchievement(trend, goal);
  return {
    code,
    label,
    unit,
    value,
    goal,
    achievement,
    trend,
    trendAchievement,
    gap: calculateGap(trend, goal),
    neededPerDay: calculateNeededPerDay(value, goal, 18),
    comparison,
    comparisonLabel: "versus período comparável",
    severity: classifyAchievement(trendAchievement),
    quality,
  };
}

const stores: StoreSummary[] = [
  {
    id: "tsp-center-norte",
    code: "TSP-CENTER-NORTE",
    name: "Center Norte",
    regional: "TSP",
    coordinator: "Karine Cunha",
    classification: "attention",
    healthScore: 78,
    trendAchievement: 0.918,
    gap: -18340,
    zeroDays: 3,
    mainOffender: "Controle",
    recoverablePotential: 13100,
    qualityScore: 0.981,
  },
  {
    id: "tsp-cidade-sp",
    code: "TSP-CIDADE-SP",
    name: "Cidade SP",
    regional: "TSP",
    coordinator: "Karine Cunha",
    classification: "highlight",
    healthScore: 94,
    trendAchievement: 1.084,
    gap: 9240,
    zeroDays: 0,
    mainOffender: "Nenhum ofensor crítico",
    recoverablePotential: 0,
    qualityScore: 0.997,
  },
  {
    id: "tsp-super-osasco",
    code: "TSP-SUPER-OSASCO",
    name: "Super Osasco",
    regional: "TSP",
    coordinator: "Jocimar Oliveira",
    classification: "recoverable",
    healthScore: 83,
    trendAchievement: 0.956,
    gap: -8400,
    zeroDays: 1,
    mainOffender: "Faturamento TIM",
    recoverablePotential: 7100,
    qualityScore: 0.989,
  },
  {
    id: "tpr-palladium-pg",
    code: "TPR-PALLADIUM-PG",
    name: "Palladium PG",
    regional: "TPR",
    coordinator: "Ana Granado",
    classification: "critical",
    healthScore: 61,
    trendAchievement: 0.796,
    gap: -27900,
    zeroDays: 5,
    mainOffender: "Controle e dias zerados",
    recoverablePotential: 14200,
    qualityScore: 0.963,
  },
  {
    id: "tsp-bonsucesso",
    code: "TSP-BONSUCESSO",
    name: "Bonsucesso",
    regional: "TSP",
    coordinator: "Francisco Marques",
    classification: "incomplete_data",
    healthScore: 68,
    trendAchievement: 0.872,
    gap: -12300,
    zeroDays: 2,
    mainOffender: "Vendedores não identificados",
    recoverablePotential: 5200,
    qualityScore: 0.881,
  },
  {
    id: "tpr-jockey",
    code: "TPR-JOCKEY",
    name: "Jockey",
    regional: "TPR",
    coordinator: "Juliana Oliveira",
    classification: "highlight",
    healthScore: 91,
    trendAchievement: 1.052,
    gap: 5160,
    zeroDays: 0,
    mainOffender: "Nenhum ofensor crítico",
    recoverablePotential: 0,
    qualityScore: 0.993,
  },
];

const actions: ActionPlan[] = [
  {
    id: "action-control-center-norte",
    title: "Recuperar Controle no Center Norte",
    description: "Revisar abordagem, mix e conversão dos atendimentos com potencial para Controle.",
    indicatorCode: "CONTROL",
    impact: 8900,
    scope: { type: "store", id: "tsp-center-norte", label: "Center Norte" },
    owner: "Karine Cunha",
    dueAt: "2026-09-04T21:00:00.000Z",
    status: "in_progress",
    priority: "critical",
    evidenceUrl: null,
    createdAt: "2026-09-03T12:00:00.000Z",
    updatedAt: FIXED_NOW,
  },
  {
    id: "action-zero-palladium-pg",
    title: "Eliminar recorrência de zerados",
    description: "Validar escala, fluxo, disponibilidade de chips e execução comercial da loja.",
    indicatorCode: "ZERO_DAYS",
    impact: 14200,
    scope: { type: "store", id: "tpr-palladium-pg", label: "Palladium PG" },
    owner: "Ana Granado",
    dueAt: "2026-09-05T15:00:00.000Z",
    status: "pending",
    priority: "high",
    evidenceUrl: null,
    createdAt: "2026-09-03T15:30:00.000Z",
    updatedAt: FIXED_NOW,
  },
  {
    id: "action-data-bonsucesso",
    title: "Relacionar vendedores pendentes",
    description: "Corrigir vínculos de vendedor para restabelecer ranking, comissão e leitura da loja.",
    indicatorCode: "DATA_QUALITY",
    impact: 5300,
    scope: { type: "store", id: "tsp-bonsucesso", label: "Bonsucesso" },
    owner: "Controladoria",
    dueAt: "2026-09-04T18:00:00.000Z",
    status: "in_progress",
    priority: "high",
    evidenceUrl: null,
    createdAt: "2026-09-04T08:00:00.000Z",
    updatedAt: FIXED_NOW,
  },
];

function scopeLabel(filters: DashboardFilters): string {
  if (!filters.scopeId || filters.scopeType === "group") return "Grupo JUFAP · Todas as lojas";
  return `${filters.scopeType} · ${filters.scopeId}`;
}

export function createMockOverview(filters: DashboardFilters): DashboardOverview {
  const scopedStores = filters.scopeType === "regional" && filters.scopeId
    ? stores.filter((store) => store.regional === filters.scopeId)
    : filters.scopeType === "store" && filters.scopeId
      ? stores.filter((store) => store.id === filters.scopeId || store.code === filters.scopeId)
      : stores;

  return {
    filters,
    scopeLabel: scopeLabel(filters),
    asOf: FIXED_NOW,
    quality,
    kpis: [
      metric("TIM_REVENUE", "Faturamento TIM", "currency", 358420, 430000, 405900, 0.041),
      metric("POST_TOTAL", "Pós Total", "count", 1286, 1180, 1410, 0.083),
      metric("FINANCIAL", "Financeiro", "currency", 397855, 406800, 421300, 0.006),
      metric("STORES_ATTENTION", "Lojas em atenção", "count", 8, 0, 8, -0.125),
    ],
    indicatorStrip: [
      metric("POST_PAID", "Pós Pago", "count", 902, 750, 986, 0.094),
      metric("CONTROL", "Controle", "count", 384, 455, 409, -0.116),
      metric("FIBER", "Fibra", "count", 103, 80, 112, 0.185),
      metric("ACCESSORIES", "Acessórios", "currency", 87791.4, 75600, 92100, 0.142),
      metric("PITZI", "Pitzi", "count", 96, 60, 104, 0.23),
      metric("PORTABILITY_ACTIVATED", "Port-in ativada", "count", 146, 185, 169, -0.078),
    ],
    narrative: {
      headline: "Pós Pago, Acessórios e Pitzi sustentam o resultado; Controle e Faturamento TIM exigem atuação.",
      summary: "A rede mantém boa composição em Pós Pago, Fibra, Acessórios e Pitzi. O principal risco está concentrado em Controle e no ritmo de Faturamento TIM. Cinco lojas explicam a maior parte do desvio, e parte relevante ainda é recuperável dentro do mês.",
      positiveDriver: "Pós Pago e Pitzi acima da meta, com Fibra acelerando.",
      mainRisk: "Controle abaixo de 90% da tendência esperada e recorrência de dias zerados.",
      recommendedAction: "Atuar primeiro nas lojas com fluxo e potencial, priorizando conversão de Controle e eliminação de zerados.",
    },
    stores: scopedStores,
    composition: [
      { code: "POST_PAID_SHARE", label: "Participação Pós Pago", value: 0.701, unit: "percent", comparison: 0.034, severity: "positive", explanation: "O Pós Pago ganhou participação no mix." },
      { code: "DEPENDENTS_PER_SALE", label: "Dependentes por venda", value: 0.64, unit: "count", comparison: -0.05, severity: "attention", explanation: "Há espaço para ampliar agregação nas lojas abaixo da mediana." },
      { code: "ACCESSORY_ATTACH", label: "Attach de acessórios", value: 0.56, unit: "percent", comparison: 0.071, severity: "positive", explanation: "Acessórios crescem acima do volume de aparelhos." },
      { code: "PITZI_CONVERSION", label: "Conversão Pitzi", value: 0.184, unit: "percent", comparison: 0.026, severity: "positive", explanation: "Proteção avançou, mas há lojas com aparelhos elegíveis sem oferta." },
      { code: "PORTABILITY_CONVERSION", label: "Conversão de portabilidade", value: 0.789, unit: "percent", comparison: -0.042, severity: "attention", explanation: "Pendências de ativação pressionam a entrega final." },
    ],
    rhythm: [
      { label: "29/08", current: 11860, goal: 14200, previous: 10620 },
      { label: "30/08", current: 16440, goal: 14200, previous: 13210 },
      { label: "31/08", current: 12950, goal: 14200, previous: 14080 },
      { label: "01/09", current: 13870, goal: 14330, previous: 12450 },
      { label: "02/09", current: 14540, goal: 14330, previous: 13960 },
      { label: "03/09", current: 15220, goal: 14330, previous: 14810 },
      { label: "04/09", current: 12300, goal: 14330, previous: 11980 },
    ],
    upStages: [
      { code: "RECEIVED", label: "Recebidos", value: 428, percentage: 1, severity: "neutral" },
      { code: "IDENTIFIED", label: "Identificados", value: 416, percentage: 0.972, severity: "positive" },
      { code: "VALIDATED", label: "Validados", value: 401, percentage: 0.937, severity: "positive" },
      { code: "DUPLICATE", label: "Duplicados", value: 18, percentage: 0.042, severity: "attention" },
      { code: "COUNTED", label: "Considerados", value: 383, percentage: 0.895, severity: "attention" },
    ],
    qualityIssues: [
      { id: "quality-datasys", category: "datasys_identification", title: "Em identificação Datasys", description: "Ativações aguardando vínculo definitivo.", count: 12, financialImpact: 7400, regional: null, storeId: null, owner: "Controladoria", openedAt: "2026-09-04T08:00:00.000Z", severity: "high", status: "in_progress" },
      { id: "quality-mobile", category: "seller_mobile", title: "Vendedor não encontrado — BU Móvel", description: "Registros sem correspondência na dimensão oficial de pessoas.", count: 8, financialImpact: 5300, regional: "TSP", storeId: "tsp-bonsucesso", owner: "Controladoria", openedAt: "2026-09-04T08:15:00.000Z", severity: "high", status: "open" },
      { id: "quality-fiber", category: "seller_fiber", title: "Vendedor não encontrado — BU Fibra", description: "Ativações de fibra sem vendedor relacionado.", count: 3, financialImpact: 2700, regional: "TPR", storeId: null, owner: "Controladoria", openedAt: "2026-09-04T08:20:00.000Z", severity: "medium", status: "open" },
      { id: "quality-kpi", category: "seller_kpi", title: "KPI sem vendedor", description: "Indicadores operacionais sem vínculo de responsável.", count: 4, financialImpact: 3000, regional: null, storeId: null, owner: "BI", openedAt: "2026-09-04T08:30:00.000Z", severity: "medium", status: "open" },
    ],
    actions: actions.map((action) => ({ ...action })),
  };
}

export function getMockStores(): StoreSummary[] {
  return stores.map((store) => ({ ...store }));
}

export function getMockActions(): ActionPlan[] {
  return actions.map((action) => ({ ...action }));
}

export const mockSources = sourceCatalog.map((source) => ({ ...source }));
export const mockMetrics = metricRegistry.map((definition) => ({ ...definition }));

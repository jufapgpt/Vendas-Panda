import type {
  DashboardOverviewResponse,
  DataQuality,
  MetricSnapshot,
  MetricUnit,
  Severity,
} from "@jufap-one/core";

const updatedAt = "2026-09-04T11:30:00.000Z";
const quality: DataQuality = {
  score: 0.974,
  state: "warning",
  pendingRecords: 27,
  pendingValue: 18400,
  updatedAt,
  message: "97,4% dos registros estão relacionados; 27 ocorrências aguardam tratamento.",
};

function metric(
  code: string,
  label: string,
  unit: MetricUnit,
  value: number,
  goal: number | null,
  trend: number | null,
  comparison: number | null,
  severity: Severity,
): MetricSnapshot {
  const achievement = goal && goal !== 0 ? value / goal : null;
  const trendAchievement = goal && goal !== 0 && trend !== null ? trend / goal : null;
  return {
    code,
    label,
    unit,
    value,
    goal,
    achievement,
    trend,
    trendAchievement,
    gap: goal === null ? null : (trend ?? value) - goal,
    neededPerDay: goal === null ? null : Math.max(0, goal - value) / 18,
    comparison,
    comparisonLabel: "versus período comparável",
    severity,
    quality,
  };
}

export const fallbackResponse: DashboardOverviewResponse = {
  meta: {
    requestId: "local-fallback",
    generatedAt: updatedAt,
    dataMode: "mock",
  },
  data: {
    filters: { period: "month", scopeType: "group", indicator: "TIM_REVENUE" },
    scopeLabel: "Grupo JUFAP · Todas as lojas",
    asOf: updatedAt,
    quality,
    kpis: [
      metric("TIM_REVENUE", "Faturamento TIM", "currency", 358420, 430000, 405900, 0.041, "attention"),
      metric("POST_TOTAL", "Pós Total", "count", 1286, 1180, 1410, 0.083, "positive"),
      metric("FINANCIAL", "Financeiro", "currency", 397855, 406800, 421300, 0.006, "positive"),
      metric("STORES_ATTENTION", "Lojas em atenção", "count", 8, null, null, -0.125, "attention"),
    ],
    indicatorStrip: [
      metric("POST_PAID", "Pós Pago", "count", 902, 750, 986, 0.094, "positive"),
      metric("CONTROL", "Controle", "count", 384, 455, 409, -0.116, "critical"),
      metric("FIBER", "Fibra", "count", 103, 80, 112, 0.185, "positive"),
      metric("ACCESSORIES", "Acessórios", "currency", 87791.4, 75600, 92100, 0.142, "positive"),
      metric("PITZI", "Pitzi", "count", 96, 60, 104, 0.23, "positive"),
      metric("PORTABILITY_ACTIVATED", "Port-in ativada", "count", 146, 185, 169, -0.078, "attention"),
    ],
    narrative: {
      headline: "Pós Pago, Acessórios e Pitzi sustentam o resultado; Controle e Faturamento TIM exigem atuação.",
      summary: "A rede mantém boa composição em Pós Pago, Fibra, Acessórios e Pitzi. O principal risco está concentrado em Controle e no ritmo de Faturamento TIM. Cinco lojas explicam a maior parte do desvio, e parte relevante ainda é recuperável dentro do mês.",
      positiveDriver: "Pós Pago e Pitzi acima da meta, com Fibra acelerando.",
      mainRisk: "Controle abaixo de 90% da tendência esperada e recorrência de dias zerados.",
      recommendedAction: "Atuar primeiro nas lojas com fluxo e potencial, priorizando conversão de Controle e eliminação de zerados.",
    },
    stores: [
      { id: "tsp-center-norte", code: "TSP-CENTER-NORTE", name: "Center Norte", regional: "TSP", coordinator: "Karine Cunha", classification: "attention", healthScore: 78, trendAchievement: 0.918, gap: -18340, zeroDays: 3, mainOffender: "Controle", recoverablePotential: 13100, qualityScore: 0.981 },
      { id: "tsp-cidade-sp", code: "TSP-CIDADE-SP", name: "Cidade SP", regional: "TSP", coordinator: "Karine Cunha", classification: "highlight", healthScore: 94, trendAchievement: 1.084, gap: 9240, zeroDays: 0, mainOffender: "Nenhum ofensor crítico", recoverablePotential: 0, qualityScore: 0.997 },
      { id: "tsp-super-osasco", code: "TSP-SUPER-OSASCO", name: "Super Osasco", regional: "TSP", coordinator: "Jocimar Oliveira", classification: "recoverable", healthScore: 83, trendAchievement: 0.956, gap: -8400, zeroDays: 1, mainOffender: "Faturamento TIM", recoverablePotential: 7100, qualityScore: 0.989 },
      { id: "tpr-palladium-pg", code: "TPR-PALLADIUM-PG", name: "Palladium PG", regional: "TPR", coordinator: "Ana Granado", classification: "critical", healthScore: 61, trendAchievement: 0.796, gap: -27900, zeroDays: 5, mainOffender: "Controle e dias zerados", recoverablePotential: 14200, qualityScore: 0.963 },
      { id: "tsp-bonsucesso", code: "TSP-BONSUCESSO", name: "Bonsucesso", regional: "TSP", coordinator: "Francisco Marques", classification: "incomplete_data", healthScore: 68, trendAchievement: 0.872, gap: -12300, zeroDays: 2, mainOffender: "Vendedores não identificados", recoverablePotential: 5200, qualityScore: 0.881 },
    ],
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
      { id: "quality-datasys", category: "datasys_identification", title: "Em identificação Datasys", description: "Ativações aguardando vínculo definitivo.", count: 12, financialImpact: 7400, regional: null, storeId: null, owner: "Controladoria", openedAt: updatedAt, severity: "high", status: "in_progress" },
      { id: "quality-mobile", category: "seller_mobile", title: "Vendedor não encontrado — BU Móvel", description: "Registros sem correspondência na dimensão oficial de pessoas.", count: 8, financialImpact: 5300, regional: "TSP", storeId: "tsp-bonsucesso", owner: "Controladoria", openedAt: updatedAt, severity: "high", status: "open" },
      { id: "quality-fiber", category: "seller_fiber", title: "Vendedor não encontrado — BU Fibra", description: "Ativações de fibra sem vendedor relacionado.", count: 3, financialImpact: 2700, regional: "TPR", storeId: null, owner: "Controladoria", openedAt: updatedAt, severity: "medium", status: "open" },
    ],
    actions: [
      { id: "action-control-center-norte", title: "Recuperar Controle no Center Norte", description: "Revisar abordagem, mix e conversão dos atendimentos.", indicatorCode: "CONTROL", impact: 8900, scope: { type: "store", id: "tsp-center-norte", label: "Center Norte" }, owner: "Karine Cunha", dueAt: "2026-09-04T21:00:00.000Z", status: "in_progress", priority: "critical", evidenceUrl: null, createdAt: updatedAt, updatedAt },
      { id: "action-zero-palladium-pg", title: "Eliminar recorrência de zerados", description: "Validar escala, fluxo, chips e execução comercial.", indicatorCode: "ZERO_DAYS", impact: 14200, scope: { type: "store", id: "tpr-palladium-pg", label: "Palladium PG" }, owner: "Ana Granado", dueAt: "2026-09-05T15:00:00.000Z", status: "pending", priority: "high", evidenceUrl: null, createdAt: updatedAt, updatedAt },
      { id: "action-data-bonsucesso", title: "Relacionar vendedores pendentes", description: "Corrigir vínculos para ranking, comissão e leitura da loja.", indicatorCode: "DATA_QUALITY", impact: 5300, scope: { type: "store", id: "tsp-bonsucesso", label: "Bonsucesso" }, owner: "Controladoria", dueAt: "2026-09-04T18:00:00.000Z", status: "in_progress", priority: "high", evidenceUrl: null, createdAt: updatedAt, updatedAt },
    ],
  },
};

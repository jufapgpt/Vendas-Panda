import type { MetricUnit, Severity } from "./contracts";

export type MetricLifecycle =
  | "draft"
  | "extracted"
  | "reconciled"
  | "approved"
  | "active"
  | "deprecated";

export interface MetricDefinition {
  code: string;
  label: string;
  domain: "commercial" | "financial" | "quality" | "operations";
  operation: "TIM" | "group";
  unit: MetricUnit;
  direction: "higher_is_better" | "lower_is_better" | "target_range";
  description: string;
  canonicalFormula: string;
  dependencies: string[];
  originalPowerBiMeasure: string | null;
  originalDax: string | null;
  lifecycle: MetricLifecycle;
}

export const metricRegistry: readonly MetricDefinition[] = [
  {
    code: "TIM_REVENUE",
    label: "Faturamento TIM",
    domain: "commercial",
    operation: "TIM",
    unit: "currency",
    direction: "higher_is_better",
    description: "Faturamento TIM elegível no contexto de data e unidade selecionado.",
    canonicalFormula: "SUM(f_faturamento_tim[valor_elegivel])",
    dependencies: ["f_faturamento_tim", "d_data", "d_loja"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "POST_TOTAL",
    label: "Pós Total",
    domain: "commercial",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Quantidade de acessos Pós Pago e Controle válidos.",
    canonicalFormula: "POST_PAID + CONTROL",
    dependencies: ["POST_PAID", "CONTROL"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "POST_PAID",
    label: "Pós Pago",
    domain: "commercial",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Quantidade de acessos Pós Pago válidos.",
    canonicalFormula: "COUNTROWS(f_ativacao WHERE categoria = 'POS_PAGO')",
    dependencies: ["f_ativacao"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "CONTROL",
    label: "Controle",
    domain: "commercial",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Quantidade de acessos Controle válidos.",
    canonicalFormula: "COUNTROWS(f_ativacao WHERE categoria = 'CONTROLE')",
    dependencies: ["f_ativacao"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "FIBER",
    label: "Fibra",
    domain: "commercial",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Quantidade de ativações de fibra elegíveis.",
    canonicalFormula: "COUNTROWS(f_fibra WHERE status_elegivel = true)",
    dependencies: ["f_fibra"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "FINANCIAL",
    label: "Financeiro",
    domain: "financial",
    operation: "TIM",
    unit: "currency",
    direction: "higher_is_better",
    description: "Resultado financeiro elegível vinculado às vendas TIM.",
    canonicalFormula: "SUM(f_financeiro_tim[valor_elegivel])",
    dependencies: ["f_financeiro_tim"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "ACCESSORIES",
    label: "Acessórios",
    domain: "commercial",
    operation: "TIM",
    unit: "currency",
    direction: "higher_is_better",
    description: "Receita líquida elegível de acessórios.",
    canonicalFormula: "SUM(f_venda_item[valor]) WHERE categoria = 'ACESSORIOS'",
    dependencies: ["f_venda_item"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "PITZI",
    label: "Pitzi",
    domain: "commercial",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Proteções Pitzi válidas.",
    canonicalFormula: "COUNTROWS(f_pitzi WHERE status_elegivel = true)",
    dependencies: ["f_pitzi"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "PITZI_CONVERSION",
    label: "Conversão Pitzi",
    domain: "commercial",
    operation: "TIM",
    unit: "percent",
    direction: "higher_is_better",
    description: "Proteções vendidas divididas por aparelhos elegíveis.",
    canonicalFormula: "PITZI / ELIGIBLE_DEVICES",
    dependencies: ["PITZI", "ELIGIBLE_DEVICES"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "PORTABILITY_ACTIVATED",
    label: "Portabilidade ativada",
    domain: "commercial",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Portabilidades solicitadas que foram efetivamente ativadas.",
    canonicalFormula: "COUNTROWS(f_portabilidade WHERE status = 'ATIVADA')",
    dependencies: ["f_portabilidade"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "ZERO_DAYS",
    label: "Dias zerados",
    domain: "operations",
    operation: "TIM",
    unit: "days",
    direction: "lower_is_better",
    description: "Dias elegíveis no período sem produção do indicador selecionado.",
    canonicalFormula: "COUNT(d_data[data]) WHERE IS_ELIGIBLE_DAY AND RESULT = 0",
    dependencies: ["d_data", "f_metrica_diaria"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "UP_G",
    label: "UP G",
    domain: "operations",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Registros válidos de UP G.",
    canonicalFormula: "COUNTROWS(f_up WHERE tipo = 'G' AND valido = true)",
    dependencies: ["f_up"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "UP_Z",
    label: "UP Z",
    domain: "operations",
    operation: "TIM",
    unit: "count",
    direction: "higher_is_better",
    description: "Registros válidos de UP Z.",
    canonicalFormula: "COUNTROWS(f_up WHERE tipo = 'Z' AND valido = true)",
    dependencies: ["f_up"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
  {
    code: "DATA_QUALITY",
    label: "Qualidade dos dados",
    domain: "quality",
    operation: "group",
    unit: "percent",
    direction: "higher_is_better",
    description: "Percentual de registros válidos e relacionados ao total recebido.",
    canonicalFormula: "VALID_RECORDS / RECEIVED_RECORDS",
    dependencies: ["fact_ingestion_run", "fact_quality_issue"],
    originalPowerBiMeasure: null,
    originalDax: null,
    lifecycle: "draft",
  },
] as const;

export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

export function calculateAchievement(realized: number, goal: number | null): number | null {
  return goal === null ? null : safeDivide(realized, goal);
}

export function calculateLinearTrend(
  realized: number,
  elapsedEligibleDays: number,
  totalEligibleDays: number,
): number | null {
  const dailyAverage = safeDivide(realized, elapsedEligibleDays);
  return dailyAverage === null ? null : dailyAverage * totalEligibleDays;
}

export function calculateGap(projectedOrRealized: number, goal: number | null): number | null {
  return goal === null ? null : projectedOrRealized - goal;
}

export function calculateNeededPerDay(
  realized: number,
  goal: number | null,
  remainingEligibleDays: number,
): number | null {
  if (goal === null) return null;
  const remaining = Math.max(0, goal - realized);
  if (remaining === 0) return 0;
  return safeDivide(remaining, remainingEligibleDays);
}

export function calculateQualityScore(validRecords: number, receivedRecords: number): number {
  if (receivedRecords <= 0) return 0;
  return Math.min(1, Math.max(0, validRecords / receivedRecords));
}

export function classifyAchievement(
  achievement: number | null,
  direction: MetricDefinition["direction"] = "higher_is_better",
): Severity {
  if (achievement === null) return "neutral";
  if (direction === "lower_is_better") {
    if (achievement <= 0.8) return "positive";
    if (achievement <= 1) return "attention";
    return "critical";
  }
  if (achievement >= 1) return "positive";
  if (achievement >= 0.9) return "attention";
  return "critical";
}

export function getMetricDefinition(code: string): MetricDefinition | undefined {
  return metricRegistry.find((metric) => metric.code === code);
}

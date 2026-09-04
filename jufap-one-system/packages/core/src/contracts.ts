import { z } from "zod";

export const PeriodSchema = z.enum([
  "today",
  "yesterday",
  "tomorrow",
  "month",
  "closing",
  "custom",
]);

export const ScopeTypeSchema = z.enum([
  "group",
  "company",
  "regional",
  "coordinator",
  "store",
]);

export const ScopeSchema = z
  .object({
    type: ScopeTypeSchema.default("group"),
    id: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
  })
  .superRefine((scope, ctx) => {
    if (scope.type !== "group" && !scope.id) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: "O identificador é obrigatório fora do escopo de grupo.",
      });
    }
  });

export const DashboardFiltersSchema = z.object({
  period: PeriodSchema.default("month"),
  scopeType: ScopeTypeSchema.default("group"),
  scopeId: z.string().min(1).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  indicator: z.string().min(1).default("TIM_REVENUE"),
});

export const MetricUnitSchema = z.enum([
  "currency",
  "count",
  "percent",
  "days",
  "hours",
  "score",
]);

export const SeveritySchema = z.enum([
  "positive",
  "neutral",
  "attention",
  "critical",
]);

export const QualityStateSchema = z.enum([
  "consolidated",
  "partial",
  "processing",
  "warning",
  "unreliable",
]);

export const DataQualitySchema = z.object({
  score: z.number().min(0).max(1),
  state: QualityStateSchema,
  pendingRecords: z.number().int().nonnegative(),
  pendingValue: z.number().nonnegative().default(0),
  updatedAt: z.iso.datetime(),
  message: z.string(),
});

export const MetricSnapshotSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  unit: MetricUnitSchema,
  value: z.number(),
  goal: z.number().nullable(),
  achievement: z.number().nullable(),
  trend: z.number().nullable(),
  trendAchievement: z.number().nullable(),
  gap: z.number().nullable(),
  neededPerDay: z.number().nullable(),
  comparison: z.number().nullable(),
  comparisonLabel: z.string(),
  severity: SeveritySchema,
  quality: DataQualitySchema,
});

export const StoreClassificationSchema = z.enum([
  "highlight",
  "recoverable",
  "attention",
  "critical",
  "incomplete_data",
]);

export const StoreSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  regional: z.string(),
  coordinator: z.string(),
  classification: StoreClassificationSchema,
  healthScore: z.number().min(0).max(100),
  trendAchievement: z.number(),
  gap: z.number(),
  zeroDays: z.number().int().nonnegative(),
  mainOffender: z.string(),
  recoverablePotential: z.number().nonnegative(),
  qualityScore: z.number().min(0).max(1),
});

export const NarrativeSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  positiveDriver: z.string(),
  mainRisk: z.string(),
  recommendedAction: z.string(),
});

export const CompositionItemSchema = z.object({
  code: z.string(),
  label: z.string(),
  value: z.number(),
  unit: MetricUnitSchema,
  comparison: z.number().nullable(),
  severity: SeveritySchema,
  explanation: z.string(),
});

export const RhythmPointSchema = z.object({
  label: z.string(),
  current: z.number(),
  goal: z.number(),
  previous: z.number(),
});

export const UpStageSchema = z.object({
  code: z.string(),
  label: z.string(),
  value: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(1),
  severity: SeveritySchema,
});

export const QualityIssueSchema = z.object({
  id: z.string(),
  category: z.enum([
    "datasys_identification",
    "seller_mobile",
    "seller_fiber",
    "seller_kpi",
    "duplicate_up",
    "source_schema",
  ]),
  title: z.string(),
  description: z.string(),
  count: z.number().int().nonnegative(),
  financialImpact: z.number().nonnegative(),
  regional: z.string().nullable(),
  storeId: z.string().nullable(),
  owner: z.string(),
  openedAt: z.iso.datetime(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "ignored"]),
});

export const ActionPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  indicatorCode: z.string(),
  impact: z.number().nonnegative(),
  scope: ScopeSchema,
  owner: z.string(),
  dueAt: z.iso.datetime(),
  status: z.enum(["pending", "in_progress", "blocked", "done"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  evidenceUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ActionUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "blocked", "done"]).optional(),
  owner: z.string().min(1).optional(),
  dueAt: z.iso.datetime().optional(),
  description: z.string().min(1).optional(),
});

export const SourceDefinitionSchema = z.object({
  code: z.string(),
  name: z.string(),
  domain: z.string(),
  operation: z.string().nullable(),
  entityName: z.string().nullable(),
  expectedGrain: z.string(),
  frequency: z.enum(["intraday", "daily", "weekly", "monthly", "on_demand"]),
  owner: z.string().nullable(),
  sensitivity: z.enum(["public", "internal", "restricted"]),
  status: z.enum(["pending_connection", "active", "warning", "disabled"]),
  driveId: z.string().nullable(),
  path: z.string().nullable(),
  tableOrSheet: z.string().nullable(),
  lastSuccessfulRunAt: z.iso.datetime().nullable(),
});

export const DashboardOverviewSchema = z.object({
  filters: DashboardFiltersSchema,
  scopeLabel: z.string(),
  asOf: z.iso.datetime(),
  quality: DataQualitySchema,
  kpis: z.array(MetricSnapshotSchema).length(4),
  indicatorStrip: z.array(MetricSnapshotSchema),
  narrative: NarrativeSchema,
  stores: z.array(StoreSummarySchema),
  composition: z.array(CompositionItemSchema),
  rhythm: z.array(RhythmPointSchema),
  upStages: z.array(UpStageSchema),
  qualityIssues: z.array(QualityIssueSchema),
  actions: z.array(ActionPlanSchema),
});

export const ApiMetaSchema = z.object({
  requestId: z.string(),
  generatedAt: z.iso.datetime(),
  dataMode: z.enum(["mock", "database"]),
});

export const DashboardOverviewResponseSchema = z.object({
  data: DashboardOverviewSchema,
  meta: ApiMetaSchema,
});

export type Period = z.infer<typeof PeriodSchema>;
export type ScopeType = z.infer<typeof ScopeTypeSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
export type DashboardFilters = z.infer<typeof DashboardFiltersSchema>;
export type MetricUnit = z.infer<typeof MetricUnitSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type DataQuality = z.infer<typeof DataQualitySchema>;
export type MetricSnapshot = z.infer<typeof MetricSnapshotSchema>;
export type StoreSummary = z.infer<typeof StoreSummarySchema>;
export type Narrative = z.infer<typeof NarrativeSchema>;
export type CompositionItem = z.infer<typeof CompositionItemSchema>;
export type RhythmPoint = z.infer<typeof RhythmPointSchema>;
export type UpStage = z.infer<typeof UpStageSchema>;
export type QualityIssue = z.infer<typeof QualityIssueSchema>;
export type ActionPlan = z.infer<typeof ActionPlanSchema>;
export type ActionUpdate = z.infer<typeof ActionUpdateSchema>;
export type SourceDefinition = z.infer<typeof SourceDefinitionSchema>;
export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;
export type DashboardOverviewResponse = z.infer<typeof DashboardOverviewResponseSchema>;

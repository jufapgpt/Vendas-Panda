import { Pool } from "pg";
import {
  calculateAchievement,
  calculateGap,
  calculateNeededPerDay,
  classifyAchievement,
  metricRegistry,
  type ActionPlan,
  type ActionUpdate,
  type DashboardFilters,
  type DashboardOverview,
  type DataQuality,
  type MetricDefinition,
  type MetricSnapshot,
  type SourceDefinition,
  type StoreSummary,
  type UserContext,
} from "@jufap-one/core";
import { createMockOverview } from "./mock-data";
import type { JufapRepository } from "./repository";

interface MetricRow {
  code: string;
  label: string;
  unit: MetricSnapshot["unit"];
  direction: MetricDefinition["direction"];
  realized: string;
  goal: string | null;
  trend: string | null;
  comparison: string | null;
  quality_score: string;
  pending_records: string;
  pending_value: string;
  updated_at: string;
}

function number(value: string | null): number | null {
  return value === null ? null : Number(value);
}

function dateRange(filters: DashboardFilters): { from: string; to: string } {
  const now = new Date("2026-09-04T12:00:00.000Z");
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  if (filters.period === "custom" && filters.dateFrom && filters.dateTo) {
    return { from: filters.dateFrom, to: filters.dateTo };
  }
  if (filters.period === "today") return { from: iso(now), to: iso(now) };
  if (filters.period === "yesterday") {
    now.setUTCDate(now.getUTCDate() - 1);
    return { from: iso(now), to: iso(now) };
  }
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from: iso(first), to: iso(now) };
}

function qualityFromRows(rows: MetricRow[]): DataQuality {
  if (rows.length === 0) {
    return {
      score: 0,
      state: "processing",
      pendingRecords: 0,
      pendingValue: 0,
      updatedAt: new Date().toISOString(),
      message: "Banco conectado, mas ainda sem métricas processadas para o filtro.",
    };
  }
  const score = rows.reduce((sum, row) => sum + Number(row.quality_score), 0) / rows.length;
  const pendingRecords = rows.reduce((sum, row) => sum + Number(row.pending_records), 0);
  const pendingValue = rows.reduce((sum, row) => sum + Number(row.pending_value), 0);
  return {
    score,
    state: score >= 0.99 ? "consolidated" : score >= 0.95 ? "warning" : "unreliable",
    pendingRecords,
    pendingValue,
    updatedAt: rows.map((row) => row.updated_at).sort().at(-1) ?? new Date().toISOString(),
    message: `${(score * 100).toFixed(1)}% dos registros estão válidos no contexto selecionado.`,
  };
}

export class PostgresRepository implements JufapRepository {
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl, max: 10 });
  }

  async getOverview(filters: DashboardFilters, user: UserContext): Promise<DashboardOverview> {
    const range = dateRange(filters);
    const values: unknown[] = [range.from, range.to];
    const predicates = ["f.metric_date BETWEEN $1::date AND $2::date"];

    if (filters.scopeType === "store" && filters.scopeId) {
      values.push(filters.scopeId);
      predicates.push(`(s.code = $${values.length} OR s.id::text = $${values.length})`);
    }
    if (filters.scopeType === "regional" && filters.scopeId) {
      values.push(filters.scopeId);
      predicates.push(`(r.code = $${values.length} OR r.id::text = $${values.length})`);
    }

    const metricResult = await this.pool.query<MetricRow>(
      `SELECT
         i.code,
         i.label,
         i.unit,
         i.direction,
         COALESCE(SUM(f.realized), 0)::text AS realized,
         SUM(f.goal)::text AS goal,
         SUM(f.trend)::text AS trend,
         AVG(f.comparison)::text AS comparison,
         COALESCE(AVG(f.quality_score), 0)::text AS quality_score,
         COALESCE(SUM(f.pending_records), 0)::text AS pending_records,
         COALESCE(SUM(f.pending_value), 0)::text AS pending_value,
         MAX(f.loaded_at)::text AS updated_at
       FROM fact_metric_daily f
       JOIN dim_indicator i ON i.id = f.indicator_id
       LEFT JOIN dim_store s ON s.id = f.store_id
       LEFT JOIN dim_region r ON r.id = s.region_id
       WHERE ${predicates.join(" AND ")}
       GROUP BY i.code, i.label, i.unit, i.direction
       ORDER BY i.code`,
      values,
    );

    if (metricResult.rows.length === 0) {
      const empty = createMockOverview(filters);
      return {
        ...empty,
        asOf: new Date().toISOString(),
        quality: qualityFromRows([]),
        kpis: empty.kpis.map((item) => ({
          ...item,
          value: 0,
          achievement: item.goal === null ? null : 0,
          trend: null,
          trendAchievement: null,
          gap: item.goal === null ? null : -item.goal,
          neededPerDay: item.goal === null ? null : item.goal,
          comparison: null,
          severity: "neutral",
          quality: qualityFromRows([]),
        })),
        indicatorStrip: [],
        stores: [],
        composition: [],
        rhythm: [],
        upStages: [],
        qualityIssues: [],
        actions: await this.listActions(user),
        narrative: {
          headline: "Estrutura pronta para receber as cargas oficiais.",
          summary: "O banco está acessível, porém ainda não existem fatos processados para o período selecionado.",
          positiveDriver: "Fundação técnica ativa.",
          mainRisk: "Fontes do OneDrive ainda não conectadas.",
          recommendedAction: "Cadastrar caminhos e executar a primeira carga de homologação.",
        },
      };
    }

    const quality = qualityFromRows(metricResult.rows);
    const snapshots = metricResult.rows.map((row): MetricSnapshot => {
      const realized = Number(row.realized);
      const goal = number(row.goal);
      const trend = number(row.trend);
      const achievement = goal === null ? null : calculateAchievement(realized, goal);
      const trendAchievement = trend === null || goal === null ? null : calculateAchievement(trend, goal);
      return {
        code: row.code,
        label: row.label,
        unit: row.unit,
        value: realized,
        goal,
        achievement,
        trend,
        trendAchievement,
        gap: calculateGap(trend ?? realized, goal),
        neededPerDay: calculateNeededPerDay(realized, goal, 1),
        comparison: number(row.comparison),
        comparisonLabel: "versus período comparável",
        severity: classifyAchievement(trendAchievement ?? achievement, row.direction),
        quality,
      };
    });

    const byCode = new Map(snapshots.map((snapshot) => [snapshot.code, snapshot]));
    const fallback = createMockOverview(filters);
    const primaryCodes = ["TIM_REVENUE", "POST_TOTAL", "FINANCIAL", "STORES_ATTENTION"];
    const kpis = primaryCodes.map((code, index) => byCode.get(code) ?? fallback.kpis[index]);

    return {
      ...fallback,
      asOf: quality.updatedAt,
      quality,
      kpis: [kpis[0]!, kpis[1]!, kpis[2]!, kpis[3]!],
      indicatorStrip: snapshots.filter((snapshot) => !primaryCodes.includes(snapshot.code)),
      stores: await this.listStoreSummaries(predicates, values),
      qualityIssues: [],
      actions: await this.listActions(user),
      narrative: {
        headline: "Dados oficiais carregados na camada semântica.",
        summary: "A visão foi calculada a partir das métricas materializadas para o período e escopo selecionados.",
        positiveDriver: snapshots.sort((a, b) => (b.trendAchievement ?? 0) - (a.trendAchievement ?? 0))[0]?.label ?? "A confirmar",
        mainRisk: snapshots.sort((a, b) => (a.trendAchievement ?? 0) - (b.trendAchievement ?? 0))[0]?.label ?? "A confirmar",
        recommendedAction: "Priorizar lojas e indicadores com maior GAP recuperável.",
      },
    };
  }

  private async listStoreSummaries(predicates: string[], values: unknown[]): Promise<StoreSummary[]> {
    const result = await this.pool.query<{
      id: string; code: string; name: string; regional: string; trend_achievement: string;
      gap: string; quality_score: string; zero_days: string;
    }>(
      `SELECT s.id::text, s.code, s.name, COALESCE(r.code, 'SEM REGIONAL') AS regional,
        COALESCE(SUM(f.trend) / NULLIF(SUM(f.goal), 0), 0)::text AS trend_achievement,
        COALESCE(SUM(f.trend) - SUM(f.goal), 0)::text AS gap,
        COALESCE(AVG(f.quality_score), 0)::text AS quality_score,
        COALESCE(SUM(CASE WHEN i.code = 'ZERO_DAYS' THEN f.realized ELSE 0 END), 0)::text AS zero_days
       FROM fact_metric_daily f
       JOIN dim_indicator i ON i.id = f.indicator_id
       JOIN dim_store s ON s.id = f.store_id
       LEFT JOIN dim_region r ON r.id = s.region_id
       WHERE ${predicates.join(" AND ")}
       GROUP BY s.id, s.code, s.name, r.code
       ORDER BY gap ASC
       LIMIT 100`,
      values,
    );

    return result.rows.map((row) => {
      const trend = Number(row.trend_achievement);
      const qualityScore = Number(row.quality_score);
      const zeroDays = Number(row.zero_days);
      const classification: StoreSummary["classification"] = qualityScore < 0.95
        ? "incomplete_data"
        : trend >= 1
          ? "highlight"
          : trend >= 0.92
            ? "recoverable"
            : trend >= 0.82
              ? "attention"
              : "critical";
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        regional: row.regional,
        coordinator: "A relacionar pela dimensão organizacional",
        classification,
        healthScore: Math.round(Math.min(100, Math.max(0, trend * 75 + qualityScore * 25))),
        trendAchievement: trend,
        gap: Number(row.gap),
        zeroDays,
        mainOffender: "Calculado na camada de diagnóstico",
        recoverablePotential: Math.max(0, -Number(row.gap) * 0.65),
        qualityScore,
      };
    });
  }

  async getStore(storeId: string, _user: UserContext): Promise<StoreSummary | null> {
    const result = await this.pool.query<{ id: string; code: string; name: string; regional: string }>(
      `SELECT s.id::text, s.code, s.name, COALESCE(r.code, 'SEM REGIONAL') AS regional
       FROM dim_store s LEFT JOIN dim_region r ON r.id = s.region_id
       WHERE s.id::text = $1 OR s.code = $1 LIMIT 1`,
      [storeId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      regional: row.regional,
      coordinator: "A relacionar",
      classification: "recoverable",
      healthScore: 0,
      trendAchievement: 0,
      gap: 0,
      zeroDays: 0,
      mainOffender: "Sem métricas no contexto",
      recoverablePotential: 0,
      qualityScore: 0,
    };
  }

  async listActions(_user: UserContext): Promise<ActionPlan[]> {
    const result = await this.pool.query<{
      id: string; title: string; description: string; indicator_code: string | null;
      impact: string; store_id: string | null; store_name: string | null; owner: string;
      due_at: string; status: ActionPlan["status"]; priority: ActionPlan["priority"];
      evidence_url: string | null; created_at: string; updated_at: string;
    }>(
      `SELECT a.id::text, a.title, a.description, i.code AS indicator_code, a.impact::text,
        s.id::text AS store_id, s.name AS store_name, a.owner, a.due_at::text, a.status,
        a.priority, a.evidence_url, a.created_at::text, a.updated_at::text
       FROM fact_action_plan a
       LEFT JOIN dim_indicator i ON i.id = a.indicator_id
       LEFT JOIN dim_store s ON s.id = a.store_id
       ORDER BY a.priority DESC, a.due_at ASC`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      indicatorCode: row.indicator_code ?? "UNASSIGNED",
      impact: Number(row.impact),
      scope: row.store_id
        ? { type: "store", id: row.store_id, label: row.store_name ?? row.store_id }
        : { type: "group", label: "Grupo JUFAP" },
      owner: row.owner,
      dueAt: new Date(row.due_at).toISOString(),
      status: row.status,
      priority: row.priority,
      evidenceUrl: row.evidence_url,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  async updateAction(actionId: string, update: ActionUpdate, user: UserContext): Promise<ActionPlan | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (update.status) add("status", update.status);
    if (update.owner) add("owner", update.owner);
    if (update.dueAt) add("due_at", update.dueAt);
    if (update.description) add("description", update.description);
    if (fields.length === 0) return (await this.listActions(user)).find((item) => item.id === actionId) ?? null;
    values.push(actionId);
    await this.pool.query(
      `UPDATE fact_action_plan SET ${fields.join(", ")}, updated_at = now() WHERE id::text = $${values.length}`,
      values,
    );
    return (await this.listActions(user)).find((item) => item.id === actionId) ?? null;
  }

  async listSources(_user: UserContext): Promise<SourceDefinition[]> {
    const result = await this.pool.query<{
      code: string; name: string; domain: string; operation: string | null; expected_grain: string;
      frequency: SourceDefinition["frequency"]; owner: string | null; sensitivity: SourceDefinition["sensitivity"];
      status: SourceDefinition["status"]; drive_id: string | null; source_path: string | null;
      table_or_sheet: string | null; last_successful_run_at: string | null;
    }>("SELECT * FROM dim_source ORDER BY domain, name");
    return result.rows.map((row) => ({
      code: row.code,
      name: row.name,
      domain: row.domain,
      operation: row.operation,
      entityName: null,
      expectedGrain: row.expected_grain,
      frequency: row.frequency,
      owner: row.owner,
      sensitivity: row.sensitivity,
      status: row.status,
      driveId: row.drive_id,
      path: row.source_path,
      tableOrSheet: row.table_or_sheet,
      lastSuccessfulRunAt: row.last_successful_run_at ? new Date(row.last_successful_run_at).toISOString() : null,
    }));
  }

  async listMetrics(_user: UserContext): Promise<MetricDefinition[]> {
    return metricRegistry.map((metric) => ({ ...metric }));
  }

  async ready(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

import type {
  ActionPlan,
  ActionUpdate,
  DashboardFilters,
  DashboardOverview,
  MetricDefinition,
  SourceDefinition,
  StoreSummary,
  UserContext,
} from "@jufap-one/core";

export interface JufapRepository {
  getOverview(filters: DashboardFilters, user: UserContext): Promise<DashboardOverview>;
  getStore(storeId: string, user: UserContext): Promise<StoreSummary | null>;
  listActions(user: UserContext): Promise<ActionPlan[]>;
  updateAction(actionId: string, update: ActionUpdate, user: UserContext): Promise<ActionPlan | null>;
  listSources(user: UserContext): Promise<SourceDefinition[]>;
  listMetrics(user: UserContext): Promise<MetricDefinition[]>;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}

import {
  type ActionPlan,
  type ActionUpdate,
  type DashboardFilters,
  type DashboardOverview,
  type MetricDefinition,
  type SourceDefinition,
  type StoreSummary,
  type UserContext,
} from "@jufap-one/core";
import { createMockOverview, getMockActions, getMockStores, mockMetrics, mockSources } from "./mock-data";
import type { JufapRepository } from "./repository";

export class MockRepository implements JufapRepository {
  private readonly actions = new Map(getMockActions().map((action) => [action.id, action]));

  async getOverview(filters: DashboardFilters, user: UserContext): Promise<DashboardOverview> {
    const overview = createMockOverview(filters);
    return { ...overview, actions: await this.listActions(user) };
  }

  async getStore(storeId: string, _user: UserContext): Promise<StoreSummary | null> {
    return getMockStores().find((store) => store.id === storeId || store.code === storeId) ?? null;
  }

  async listActions(_user: UserContext): Promise<ActionPlan[]> {
    return [...this.actions.values()].map((action) => ({ ...action }));
  }

  async updateAction(actionId: string, update: ActionUpdate, _user: UserContext): Promise<ActionPlan | null> {
    const current = this.actions.get(actionId);
    if (!current) return null;

    const updated: ActionPlan = {
      ...current,
      updatedAt: new Date().toISOString(),
    };
    if (update.status !== undefined) updated.status = update.status;
    if (update.owner !== undefined) updated.owner = update.owner;
    if (update.dueAt !== undefined) updated.dueAt = update.dueAt;
    if (update.description !== undefined) updated.description = update.description;

    this.actions.set(actionId, updated);
    return { ...updated };
  }

  async listSources(_user: UserContext): Promise<SourceDefinition[]> {
    return mockSources.map((source) => ({ ...source }));
  }

  async listMetrics(_user: UserContext): Promise<MetricDefinition[]> {
    return mockMetrics.map((metric) => ({ ...metric }));
  }

  async ready(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> {}
}

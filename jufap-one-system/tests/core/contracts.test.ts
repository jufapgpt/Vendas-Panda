import assert from "node:assert/strict";
import test from "node:test";
import {
  DashboardFiltersSchema,
  ScopeSchema,
} from "../../packages/core/src/contracts";

test("aplica filtros padrão da visão executiva", () => {
  const filters = DashboardFiltersSchema.parse({});
  assert.equal(filters.period, "month");
  assert.equal(filters.scopeType, "group");
  assert.equal(filters.indicator, "TIM_REVENUE");
});

test("exige identificador em escopos inferiores ao grupo", () => {
  assert.equal(ScopeSchema.safeParse({ type: "group" }).success, true);
  assert.equal(ScopeSchema.safeParse({ type: "regional" }).success, false);
  assert.equal(ScopeSchema.safeParse({ type: "regional", id: "TSP" }).success, true);
});

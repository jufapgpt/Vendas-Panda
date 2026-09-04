import assert from "node:assert/strict";
import test from "node:test";
import { reconcile } from "../../workers/metrics/src/reconciliation";

const base = {
  indicatorCode: "TIM_REVENUE",
  referenceDate: "2026-09-04",
  scopeType: "group",
  scopeId: null,
  baselineSource: "Power BI",
  toleranceAbsolute: 1,
  toleranceRelative: 0.001,
};

test("classifica valores idênticos como reconciliados", () => {
  const result = reconcile({ ...base, baselineValue: 100, candidateValue: 100 });
  assert.equal(result.status, "matched");
  assert.equal(result.absoluteDifference, 0);
});

test("aceita diferença dentro da tolerância", () => {
  const result = reconcile({ ...base, baselineValue: 1000, candidateValue: 1000.5 });
  assert.equal(result.status, "within_tolerance");
});

test("sinaliza divergência acima da tolerância", () => {
  const result = reconcile({ ...base, baselineValue: 1000, candidateValue: 980 });
  assert.equal(result.status, "divergent");
  assert.equal(result.absoluteDifference, -20);
});

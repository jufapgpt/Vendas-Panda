import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAchievement,
  calculateGap,
  calculateLinearTrend,
  calculateNeededPerDay,
  calculateQualityScore,
  classifyAchievement,
} from "../../packages/core/src/metrics";

test("calcula atingimento e GAP sem mascarar divisão por zero", () => {
  assert.equal(calculateAchievement(80, 100), 0.8);
  assert.equal(calculateAchievement(80, 0), null);
  assert.equal(calculateGap(95, 100), -5);
  assert.equal(calculateGap(95, null), null);
});

test("projeta tendência linear e necessário por dia", () => {
  assert.equal(calculateLinearTrend(50, 5, 20), 200);
  assert.equal(calculateLinearTrend(50, 0, 20), null);
  assert.equal(calculateNeededPerDay(80, 100, 4), 5);
  assert.equal(calculateNeededPerDay(120, 100, 4), 0);
  assert.equal(calculateNeededPerDay(80, 100, 0), null);
});

test("classifica atingimento conforme direção do indicador", () => {
  assert.equal(classifyAchievement(1.02), "positive");
  assert.equal(classifyAchievement(0.94), "attention");
  assert.equal(classifyAchievement(0.75), "critical");
  assert.equal(classifyAchievement(0.75, "lower_is_better"), "positive");
});

test("limita qualidade ao intervalo entre zero e um", () => {
  assert.equal(calculateQualityScore(97, 100), 0.97);
  assert.equal(calculateQualityScore(120, 100), 1);
  assert.equal(calculateQualityScore(0, 0), 0);
});

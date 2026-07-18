import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStressTest,
  DEFAULT_STRESS,
  INDUSTRY_PRESETS,
  normalizeRiskCase,
} from "../lib/engine.ts";

const baseCase = {
  locale: "en",
  context: "test case",
  business: INDUSTRY_PRESETS.Manufacturing,
  stress: {
    revenueDrop: 0,
    marginDrop: 0,
    paymentDelay: 0,
    customerLoss: 0,
    debtCall: 0,
    inventoryImpairment: 0,
  },
};

test("worse weather never creates more runway", () => {
  const calm = calculateStressTest(baseCase);
  const stressed = calculateStressTest({ ...baseCase, stress: DEFAULT_STRESS });
  assert.ok(stressed.runwayMonths <= calm.runwayMonths);
  assert.ok(stressed.oneTimeShock >= calm.oneTimeShock);
  assert.ok(stressed.stressedNetCashFlow <= calm.stressedNetCashFlow);
});

test("normalization clamps adversarial numeric input", () => {
  const normalized = normalizeRiskCase({
    ...baseCase,
    business: {
      ...baseCase.business,
      grossMargin: 250,
      cash: -40,
      concentration: Number.POSITIVE_INFINITY,
    },
    stress: {
      ...DEFAULT_STRESS,
      revenueDrop: 999,
      paymentDelay: -2,
    },
  });

  assert.equal(normalized.business.grossMargin, 100);
  assert.equal(normalized.business.cash, 0);
  assert.equal(normalized.business.concentration, 0);
  assert.equal(normalized.stress.revenueDrop, 95);
  assert.equal(normalized.stress.paymentDelay, 0);
});

test("engine exposes evidence and correctly labels collection days", () => {
  const result = calculateStressTest({ ...baseCase, stress: DEFAULT_STRESS });
  assert.deepEqual(
    result.calculationTrace.map(({ id }) => id),
    ["stressed_revenue", "monthly_cash_flow", "one_time_shock", "survival_runway"],
  );
  assert.equal(result.lifelines.find(({ key }) => key === "collection")?.unit, "days");
  assert.ok(result.lifelines.some(({ key }) => key === result.firstFailure));
});

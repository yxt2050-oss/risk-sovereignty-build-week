import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStressTest,
  DEFAULT_STRESS,
  INDUSTRY_PRESETS,
  PROFILE_PRESETS,
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
  assert.equal(normalized.stress.revenueDrop, 100);
  assert.equal(normalized.stress.paymentDelay, 0);
});

test("engine exposes evidence and correctly labels collection days", () => {
  const result = calculateStressTest({ ...baseCase, stress: DEFAULT_STRESS });
  assert.deepEqual(
    result.calculationTrace.map(({ id }) => id),
    ["stressed_revenue", "monthly_cash_flow", "liquidity_shock", "asset_impairment", "survival_runway"],
  );
  assert.equal(result.lifelines.find(({ key }) => key === "collection")?.unit, "days");
  assert.ok(result.lifelines.some(({ key }) => key === result.firstFailure));
});

test("inventory impairment is economic damage, not an invented cash outflow", () => {
  const calm = calculateStressTest(baseCase);
  const impaired = calculateStressTest({
    ...baseCase,
    stress: { ...baseCase.stress, inventoryImpairment: 100 },
  });
  assert.equal(impaired.availableBuffer, calm.availableBuffer);
  assert.ok(impaired.oneTimeShock > calm.oneTimeShock);
});

test("household mode translates job, housing, debt, and emergency stress into runway", () => {
  const householdCase = {
    locale: "en",
    context: "one income supports the household",
    business: PROFILE_PRESETS["Single-income Household"],
    stress: DEFAULT_STRESS,
  };
  const result = calculateStressTest(householdCase);
  assert.equal(result.subjectType, "household");
  assert.ok(result.calculationTrace.some(({ id }) => id === "stressed_income"));
  assert.ok(result.calculationTrace.some(({ id }) => id === "liquidity_shock"));
  assert.ok(result.lifelines.find(({ key }) => key === "collection")?.unit === "%");
  assert.ok(result.runwayMonths >= 0);
});

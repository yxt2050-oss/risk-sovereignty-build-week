import assert from "node:assert/strict";
import test from "node:test";
import {
  calibrateHistory,
  stressRangesForProfile,
  stressTemplateForProfile,
} from "../lib/historyCalibration.ts";

const rows = [
  { id: "jan", month: "2026-01", revenue: 100, grossMargin: 40, costs: 30, receivableDays: 30, debtPayments: null, assetIncome: null },
  { id: "mar", month: "2026-03", revenue: 96, grossMargin: 39, costs: 31.5, receivableDays: 35, debtPayments: null, assetIncome: null },
  { id: "jun", month: "2026-06", revenue: 90, grossMargin: 37, costs: 33, receivableDays: 42, debtPayments: null, assetIncome: null },
];

test("missing calendar months use elapsed time instead of zero-filled rows", () => {
  const result = calibrateHistory({
    rows,
    subjectType: "business",
    profile: "Professional Services",
    scenario: "pessimistic",
    horizonMonths: 6,
  });
  const revenue = result.metrics.find((metric) => metric.metric === "revenue");
  assert.equal(revenue.observations, 3);
  assert.equal(revenue.spanMonths, 5);
  assert.equal(revenue.firstMonth, "2026-01");
  assert.equal(revenue.lastMonth, "2026-06");
  assert.ok(result.recommendedStress.revenueDrop > 0);
  assert.ok(result.recommendedStress.expenseIncrease > 0);
  assert.ok(result.recommendedStress.paymentDelay > 0);
});

test("extreme calibration is never weaker than guarded calibration", () => {
  const guarded = calibrateHistory({ rows, subjectType: "business", profile: "Manufacturing", scenario: "guarded", horizonMonths: 6 });
  const extreme = calibrateHistory({ rows, subjectType: "business", profile: "Manufacturing", scenario: "extreme", horizonMonths: 6 });
  for (const key of ["revenueDrop", "marginDrop", "expenseIncrease", "paymentDelay"]) {
    assert.ok(extreme.recommendedStress[key] >= guarded.recommendedStress[key]);
  }
});

test("profile-specific defaults and ranges do not collapse into one template", () => {
  const professional = stressTemplateForProfile("Professional Services", "business");
  const restaurant = stressTemplateForProfile("Accommodation & Food Services", "business");
  const professionalRanges = stressRangesForProfile("Professional Services", "business");
  const restaurantRanges = stressRangesForProfile("Accommodation & Food Services", "business");
  assert.ok(restaurant.revenueDrop > professional.revenueDrop);
  assert.ok(restaurant.expenseIncrease > professional.expenseIncrease);
  assert.ok(restaurantRanges.revenueDrop > professionalRanges.revenueDrop);
  assert.ok(restaurantRanges.expenseIncrease > professionalRanges.expenseIncrease);
});

test("extreme multiplier can be raised aggressively while physical percentage caps remain", () => {
  const result = calibrateHistory({
    rows,
    subjectType: "business",
    profile: "Construction",
    scenario: "extreme",
    horizonMonths: 12,
    extremeMultiplier: 8,
  });
  assert.equal(result.scenarioMultiplier, 8);
  assert.ok(result.recommendedStress.revenueDrop <= 100);
  assert.ok(result.recommendedStress.expenseIncrease <= 500);
});

test("a flat history still produces an explicit profile floor", () => {
  const flatRows = rows.map((row) => ({ ...row, revenue: 100, grossMargin: 40, costs: 30, receivableDays: 30 }));
  const result = calibrateHistory({
    rows: flatRows,
    subjectType: "business",
    profile: "Construction",
    scenario: "guarded",
    horizonMonths: 6,
  });
  assert.equal(result.recommendedStress.revenueDrop, 15);
  assert.equal(result.recommendedStress.expenseIncrease, 10);
  assert.ok(result.warnings.some((warning) => warning.includes("seasonal")));
});

test("household calibration keeps labor, essential costs, debt, and asset income separate", () => {
  const householdRows = [
    { id: "a", month: "2026-01", revenue: 8, grossMargin: null, costs: 3, receivableDays: null, debtPayments: 0.7, assetIncome: 0.2 },
    { id: "b", month: "2026-04", revenue: 7.5, grossMargin: null, costs: 3.2, receivableDays: null, debtPayments: 0.75, assetIncome: 0.15 },
  ];
  const result = calibrateHistory({ rows: householdRows, subjectType: "household", profile: "Single-income Household", scenario: "pessimistic", horizonMonths: 6 });
  assert.deepEqual(
    Object.keys(result.recommendedStress).sort(),
    ["assetIncomeDrop", "debtPaymentIncrease", "expenseIncrease", "revenueDrop"],
  );
});

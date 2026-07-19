import { DEFAULT_STRESS, PROFILE_PRESETS, type Profile, type StressInputs, type SubjectType } from "./engine.ts";

export type CalibrationScenario = "guarded" | "pessimistic" | "extreme";
export type HistoryMetricKey =
  | "revenue"
  | "grossMargin"
  | "costs"
  | "receivableDays"
  | "debtPayments"
  | "assetIncome";

export type MonthlyHistoryRow = {
  id: string;
  month: string;
  revenue: number | null;
  grossMargin: number | null;
  costs: number | null;
  receivableDays: number | null;
  debtPayments: number | null;
  assetIncome: number | null;
};

export type MetricCalibration = {
  metric: HistoryMetricKey;
  stressKey: keyof StressInputs;
  observations: number;
  firstMonth: string;
  lastMonth: string;
  spanMonths: number;
  observedChange: number;
  observedUnit: "%" | "pts" | "days";
  adverseMonthlyRate: number;
  trendStress: number;
  floorStress: number;
  recommendedStress: number;
};

export type HistoryCalibrationResult = {
  scenario: CalibrationScenario;
  scenarioMultiplier: number;
  industryFactor: number;
  industryRhythm: "lower" | "moderate" | "higher";
  horizonMonths: number;
  confidence: "low" | "medium" | "high";
  metrics: MetricCalibration[];
  recommendedStress: Partial<StressInputs>;
  warnings: string[];
};

type MetricDefinition = {
  key: HistoryMetricKey;
  stressKey: keyof StressInputs;
  direction: "up" | "down";
  mode: "percent" | "points";
  outputUnit: "%" | "pts" | "days";
  cap: number;
};

type ScenarioDefinition = {
  multiplier: number;
  floorMultiplier: number;
};

type ProfilePrior = {
  factor: number;
  rhythm: "lower" | "moderate" | "higher";
  seasonal: boolean;
  floors: Partial<Record<keyof StressInputs, number>>;
};

export const CALIBRATION_SCENARIOS: Record<CalibrationScenario, ScenarioDefinition> = {
  guarded: { multiplier: 1.25, floorMultiplier: 1 },
  pessimistic: { multiplier: 1.5, floorMultiplier: 1.3 },
  extreme: { multiplier: 2, floorMultiplier: 1.8 },
};

const businessMetricSet: MetricDefinition[] = [
  { key: "revenue", stressKey: "revenueDrop", direction: "down", mode: "percent", outputUnit: "%", cap: 100 },
  { key: "grossMargin", stressKey: "marginDrop", direction: "down", mode: "points", outputUnit: "pts", cap: 80 },
  { key: "costs", stressKey: "expenseIncrease", direction: "up", mode: "percent", outputUnit: "%", cap: 500 },
  { key: "receivableDays", stressKey: "paymentDelay", direction: "up", mode: "points", outputUnit: "days", cap: 730 },
];

const householdMetricSet: MetricDefinition[] = [
  { key: "revenue", stressKey: "revenueDrop", direction: "down", mode: "percent", outputUnit: "%", cap: 100 },
  { key: "costs", stressKey: "expenseIncrease", direction: "up", mode: "percent", outputUnit: "%", cap: 500 },
  { key: "debtPayments", stressKey: "debtPaymentIncrease", direction: "up", mode: "percent", outputUnit: "%", cap: 500 },
  { key: "assetIncome", stressKey: "assetIncomeDrop", direction: "down", mode: "percent", outputUnit: "%", cap: 100 },
];

const moderateBusiness: ProfilePrior = {
  factor: 1,
  rhythm: "moderate",
  seasonal: false,
  floors: { revenueDrop: 10, marginDrop: 3, expenseIncrease: 6, paymentDelay: 15 },
};

const profilePriors: Partial<Record<Profile, ProfilePrior>> = {
  "Retail Trade": { factor: 1.12, rhythm: "higher", seasonal: true, floors: { revenueDrop: 12, marginDrop: 3, expenseIncrease: 7, paymentDelay: 10 } },
  "Professional Services": { factor: 0.92, rhythm: "lower", seasonal: false, floors: { revenueDrop: 8, marginDrop: 2, expenseIncrease: 5, paymentDelay: 18 } },
  "Health Care & Social Assistance": { factor: 0.9, rhythm: "lower", seasonal: false, floors: { revenueDrop: 8, marginDrop: 2, expenseIncrease: 6, paymentDelay: 20 } },
  "Other Services": moderateBusiness,
  Construction: { factor: 1.25, rhythm: "higher", seasonal: true, floors: { revenueDrop: 15, marginDrop: 4, expenseIncrease: 10, paymentDelay: 30 } },
  "Accommodation & Food Services": { factor: 1.3, rhythm: "higher", seasonal: true, floors: { revenueDrop: 18, marginDrop: 5, expenseIncrease: 10, paymentDelay: 7 } },
  Manufacturing: { factor: 1.2, rhythm: "higher", seasonal: true, floors: { revenueDrop: 14, marginDrop: 4, expenseIncrease: 8, paymentDelay: 20 } },
  "Transportation & Warehousing": { factor: 1.25, rhythm: "higher", seasonal: true, floors: { revenueDrop: 15, marginDrop: 4, expenseIncrease: 12, paymentDelay: 15 } },
  "Professional / Freelance": { factor: 1, rhythm: "moderate", seasonal: false, floors: { revenueDrop: 12, marginDrop: 3, expenseIncrease: 6, paymentDelay: 20 } },
  "Personal Care & Services": { factor: 1.12, rhythm: "higher", seasonal: true, floors: { revenueDrop: 14, marginDrop: 3, expenseIncrease: 8, paymentDelay: 7 } },
  "Construction Trades": { factor: 1.25, rhythm: "higher", seasonal: true, floors: { revenueDrop: 16, marginDrop: 4, expenseIncrease: 10, paymentDelay: 25 } },
  "Transportation / Gig": { factor: 1.22, rhythm: "higher", seasonal: true, floors: { revenueDrop: 15, marginDrop: 4, expenseIncrease: 12, paymentDelay: 5 } },
  "Retail / E-commerce": { factor: 1.18, rhythm: "higher", seasonal: true, floors: { revenueDrop: 15, marginDrop: 4, expenseIncrease: 8, paymentDelay: 7 } },
  "Real Estate Services": { factor: 1.25, rhythm: "higher", seasonal: true, floors: { revenueDrop: 18, marginDrop: 4, expenseIncrease: 7, paymentDelay: 20 } },
  "Arts / Media": { factor: 1.2, rhythm: "higher", seasonal: true, floors: { revenueDrop: 16, marginDrop: 3, expenseIncrease: 6, paymentDelay: 20 } },
  "Home Services": { factor: 1.08, rhythm: "moderate", seasonal: true, floors: { revenueDrop: 12, marginDrop: 3, expenseIncrease: 8, paymentDelay: 12 } },
  "Early-career Renter": { factor: 1.12, rhythm: "higher", seasonal: false, floors: { revenueDrop: 12, expenseIncrease: 8, debtPaymentIncrease: 10, assetIncomeDrop: 25 } },
  "Single-income Household": { factor: 1.2, rhythm: "higher", seasonal: false, floors: { revenueDrop: 15, expenseIncrease: 9, debtPaymentIncrease: 12, assetIncomeDrop: 25 } },
  "Dual-income Family": { factor: 0.95, rhythm: "lower", seasonal: false, floors: { revenueDrop: 10, expenseIncrease: 8, debtPaymentIncrease: 10, assetIncomeDrop: 20 } },
  "Homeowner with Mortgage": { factor: 1.05, rhythm: "moderate", seasonal: false, floors: { revenueDrop: 10, expenseIncrease: 9, debtPaymentIncrease: 15, assetIncomeDrop: 22 } },
  "Wage + Gig Household": { factor: 1.18, rhythm: "higher", seasonal: true, floors: { revenueDrop: 14, expenseIncrease: 9, debtPaymentIncrease: 12, assetIncomeDrop: 25 } },
  "Student-loan Household": { factor: 1.12, rhythm: "higher", seasonal: false, floors: { revenueDrop: 12, expenseIncrease: 8, debtPaymentIncrease: 15, assetIncomeDrop: 25 } },
  "Near-retirement Household": { factor: 1.08, rhythm: "moderate", seasonal: false, floors: { revenueDrop: 10, expenseIncrease: 8, debtPaymentIncrease: 10, assetIncomeDrop: 25 } },
};

const householdFallback: ProfilePrior = {
  factor: 1,
  rhythm: "moderate",
  seasonal: false,
  floors: { revenueDrop: 10, expenseIncrease: 8, debtPaymentIncrease: 10, assetIncomeDrop: 20 },
};

const profileRangeOverrides: Record<Profile, Partial<Record<keyof StressInputs, number>>> = {
  "Retail Trade": { revenueDrop: 95, marginDrop: 55, expenseIncrease: 280, paymentDelay: 150 },
  "Professional Services": { revenueDrop: 80, marginDrop: 40, expenseIncrease: 180, paymentDelay: 300 },
  "Health Care & Social Assistance": { revenueDrop: 75, marginDrop: 38, expenseIncrease: 210, paymentDelay: 365 },
  "Other Services": { revenueDrop: 90, marginDrop: 50, expenseIncrease: 240, paymentDelay: 180 },
  Construction: { revenueDrop: 100, marginDrop: 70, expenseIncrease: 400, paymentDelay: 730 },
  "Accommodation & Food Services": { revenueDrop: 100, marginDrop: 65, expenseIncrease: 350, paymentDelay: 120 },
  Manufacturing: { revenueDrop: 100, marginDrop: 70, expenseIncrease: 400, paymentDelay: 540 },
  "Transportation & Warehousing": { revenueDrop: 100, marginDrop: 65, expenseIncrease: 400, paymentDelay: 300 },
  "Professional / Freelance": { revenueDrop: 100, marginDrop: 52, expenseIncrease: 220, paymentDelay: 540 },
  "Personal Care & Services": { revenueDrop: 100, marginDrop: 58, expenseIncrease: 300, paymentDelay: 90 },
  "Construction Trades": { revenueDrop: 100, marginDrop: 70, expenseIncrease: 400, paymentDelay: 540 },
  "Transportation / Gig": { revenueDrop: 100, marginDrop: 65, expenseIncrease: 400, paymentDelay: 90 },
  "Retail / E-commerce": { revenueDrop: 100, marginDrop: 65, expenseIncrease: 350, paymentDelay: 150 },
  "Real Estate Services": { revenueDrop: 100, marginDrop: 62, expenseIncrease: 260, paymentDelay: 365 },
  "Arts / Media": { revenueDrop: 100, marginDrop: 62, expenseIncrease: 240, paymentDelay: 540 },
  "Home Services": { revenueDrop: 100, marginDrop: 58, expenseIncrease: 320, paymentDelay: 240 },
  "Early-career Renter": { expenseIncrease: 200, incomeInterruption: 18, emergencyExpense: 120, debtPaymentIncrease: 350, assetIncomeInterruption: 24 },
  "Single-income Household": { expenseIncrease: 250, incomeInterruption: 30, emergencyExpense: 180, debtPaymentIncrease: 400, assetIncomeInterruption: 24 },
  "Dual-income Family": { expenseIncrease: 200, incomeInterruption: 18, emergencyExpense: 260, debtPaymentIncrease: 350, assetIncomeInterruption: 24 },
  "Homeowner with Mortgage": { expenseIncrease: 260, incomeInterruption: 24, emergencyExpense: 240, debtPaymentIncrease: 450, assetIncomeInterruption: 30 },
  "Wage + Gig Household": { expenseIncrease: 300, incomeInterruption: 30, emergencyExpense: 200, debtPaymentIncrease: 400, assetIncomeInterruption: 30 },
  "Student-loan Household": { expenseIncrease: 230, incomeInterruption: 24, emergencyExpense: 160, debtPaymentIncrease: 500, assetIncomeInterruption: 24 },
  "Near-retirement Household": { expenseIncrease: 220, incomeInterruption: 36, emergencyExpense: 300, debtPaymentIncrease: 350, assetIncomeInterruption: 48 },
};

function monthIndex(month: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const value = Number(match[2]);
  if (value < 1 || value > 12) return null;
  return year * 12 + value - 1;
}

function round(value: number, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function calibrateMetric(
  rows: MonthlyHistoryRow[],
  definition: MetricDefinition,
  scenario: ScenarioDefinition,
  prior: ProfilePrior,
  horizonMonths: number,
): MetricCalibration | null {
  const points = rows
    .map((row) => ({ month: row.month, index: monthIndex(row.month), value: row[definition.key] }))
    .filter((point): point is { month: string; index: number; value: number } =>
      point.index !== null && point.value !== null && Number.isFinite(point.value) && point.value >= 0,
    )
    .sort((a, b) => a.index - b.index);

  if (points.length < 2) return null;

  const pairwiseRates: number[] = [];
  for (let left = 0; left < points.length - 1; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      const months = points[right].index - points[left].index;
      if (months <= 0) continue;
      if (definition.mode === "percent") {
        if (points[left].value <= 0) continue;
        pairwiseRates.push(((points[right].value / points[left].value) - 1) * 100 / months);
      } else {
        pairwiseRates.push((points[right].value - points[left].value) / months);
      }
    }
  }
  if (!pairwiseRates.length) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const spanMonths = Math.max(1, last.index - first.index);
  const slope = median(pairwiseRates);
  const adverseMonthlyRate = Math.max(0, definition.direction === "down" ? -slope : slope);
  const trendStress = adverseMonthlyRate * horizonMonths * scenario.multiplier * prior.factor;
  const floorStress = (prior.floors[definition.stressKey] ?? 0) * scenario.floorMultiplier;
  const recommendedStress = Math.min(definition.cap, Math.max(trendStress, floorStress));
  const observedChange = definition.mode === "percent"
    ? first.value > 0 ? ((last.value / first.value) - 1) * 100 : 0
    : last.value - first.value;

  return {
    metric: definition.key,
    stressKey: definition.stressKey,
    observations: points.length,
    firstMonth: first.month,
    lastMonth: last.month,
    spanMonths,
    observedChange: round(observedChange),
    observedUnit: definition.outputUnit,
    adverseMonthlyRate: round(adverseMonthlyRate, 2),
    trendStress: round(trendStress),
    floorStress: round(floorStress),
    recommendedStress: round(recommendedStress),
  };
}

export function calibrateHistory(args: {
  rows: MonthlyHistoryRow[];
  subjectType: SubjectType;
  profile: Profile;
  scenario: CalibrationScenario;
  horizonMonths: number;
  extremeMultiplier?: number;
}): HistoryCalibrationResult {
  const baseScenario = CALIBRATION_SCENARIOS[args.scenario];
  const scenario = args.scenario === "extreme"
    ? { ...baseScenario, multiplier: Math.max(2, Math.min(10, args.extremeMultiplier ?? 2)) }
    : baseScenario;
  const prior = profilePriors[args.profile]
    ?? (args.subjectType === "household" ? householdFallback : moderateBusiness);
  const horizonMonths = Math.max(1, Math.min(18, Math.round(args.horizonMonths)));
  const definitions = args.subjectType === "household" ? householdMetricSet : businessMetricSet;
  const metrics = definitions
    .map((definition) => calibrateMetric(args.rows, definition, scenario, prior, horizonMonths))
    .filter((metric): metric is MetricCalibration => metric !== null);
  const recommendedStress = Object.fromEntries(
    metrics.map((metric) => [metric.stressKey, metric.recommendedStress]),
  ) as Partial<StressInputs>;

  const minimumObservations = metrics.length
    ? Math.min(...metrics.map((metric) => metric.observations))
    : 0;
  const longestSpan = metrics.length
    ? Math.max(...metrics.map((metric) => metric.spanMonths))
    : 0;
  const confidence = minimumObservations >= 4 && longestSpan >= 5
    ? "high"
    : minimumObservations >= 3 && longestSpan >= 3
      ? "medium"
      : "low";
  const warnings: string[] = [];
  if (metrics.length < definitions.length) {
    warnings.push("Some stress channels have fewer than two valid observations and were left unchanged.");
  }
  if (prior.seasonal && longestSpan < 12) {
    warnings.push("This profile is seasonal or cyclical. A partial-year trend may mix seasonality with deterioration, so the result is a stress anchor, not a forecast.");
  }
  if (confidence === "low") {
    warnings.push("Sparse history produces a low-confidence anchor. Keep the suggested sliders editable and test a wider range.");
  }

  return {
    scenario: args.scenario,
    scenarioMultiplier: scenario.multiplier,
    industryFactor: prior.factor,
    industryRhythm: prior.rhythm,
    horizonMonths,
    confidence,
    metrics,
    recommendedStress,
    warnings,
  };
}

export function historyMetricsForSubject(subjectType: SubjectType) {
  return (subjectType === "household" ? householdMetricSet : businessMetricSet).map(({ key }) => key);
}

export function makeSampleHistory(subjectType: SubjectType, profile: Profile): MonthlyHistoryRow[] {
  const base = ["2026-01", "2026-03", "2026-05"];
  const preset = PROFILE_PRESETS[profile];
  if (subjectType === "household") {
    return base.map((month, index) => ({
      id: `${profile}-${month}`,
      month,
      revenue: round(preset.monthlyRevenue * [1.06, 1.02, 1][index], 2),
      grossMargin: null,
      costs: round(preset.fixedCosts * [0.94, 0.97, 1][index], 2),
      receivableDays: null,
      debtPayments: round(preset.monthlyDebtPayments * [0.94, 0.97, 1][index], 2),
      assetIncome: round(preset.monthlyAssetIncome * [1.12, 1.05, 1][index], 2),
    }));
  }
  return base.map((month, index) => ({
    id: `${profile}-${month}`,
    month,
    revenue: round(preset.monthlyRevenue * [1.1, 1.04, 1][index], 1),
    grossMargin: round(preset.grossMargin + [2, 1, 0][index], 1),
    costs: round(preset.fixedCosts * [0.92, 0.96, 1][index], 1),
    receivableDays: Math.max(0, round(preset.receivableDays - [14, 7, 0][index], 0)),
    debtPayments: null,
    assetIncome: null,
  }));
}

export function stressTemplateForProfile(profile: Profile, subjectType: SubjectType): StressInputs {
  const prior = profilePriors[profile] ?? (subjectType === "household" ? householdFallback : moderateBusiness);
  const preset = PROFILE_PRESETS[profile];
  if (subjectType === "household") {
    const singleIncome = profile === "Single-income Household" || profile === "Early-career Renter" || profile === "Student-loan Household";
    return {
      ...DEFAULT_STRESS,
      revenueDrop: round((prior.floors.revenueDrop ?? 10) * 1.25),
      expenseIncrease: round((prior.floors.expenseIncrease ?? 8) * 1.25),
      incomeInterruption: singleIncome ? 4 : profile === "Wage + Gig Household" ? 3 : 2,
      emergencyExpense: round(Math.max(4, preset.monthlyRevenue * (singleIncome ? 1 : 0.75))),
      debtPaymentIncrease: round((prior.floors.debtPaymentIncrease ?? 10) * 1.25),
      debtCall: singleIncome ? 35 : 25,
      liquidAssetHaircut: profile === "Near-retirement Household" ? 25 : 18,
      assetIncomeDrop: round((prior.floors.assetIncomeDrop ?? 20) * 1.25),
      assetIncomeInterruption: preset.monthlyAssetIncome > 0 ? 4 : 0,
      assetValueDrop: preset.assetProfile === "Rental real estate" ? 25 : preset.assetProfile === "Public stocks / ETFs" || preset.assetProfile === "REITs" ? 40 : 30,
    };
  }

  const capitalHeavy = profile === "Construction" || profile === "Manufacturing" || profile === "Transportation & Warehousing" || profile === "Construction Trades" || profile === "Transportation / Gig";
  const inventoryHeavy = profile === "Retail Trade" || profile === "Retail / E-commerce" || profile === "Manufacturing";
  const concentrationHeavy = profile === "Professional Services" || profile === "Professional / Freelance" || profile === "Real Estate Services" || profile === "Arts / Media";
  return {
    ...DEFAULT_STRESS,
    revenueDrop: round((prior.floors.revenueDrop ?? 10) * 1.3),
    marginDrop: round((prior.floors.marginDrop ?? 3) * 1.35),
    expenseIncrease: round((prior.floors.expenseIncrease ?? 6) * 1.3),
    paymentDelay: round((prior.floors.paymentDelay ?? 15) * 1.25, 0),
    customerLoss: concentrationHeavy ? 35 : prior.rhythm === "higher" ? 28 : 20,
    debtCall: capitalHeavy ? 45 : 35,
    inventoryImpairment: inventoryHeavy ? 30 : capitalHeavy ? 22 : 15,
  };
}

export function stressRangesForProfile(profile: Profile, subjectType: SubjectType): Record<keyof StressInputs, number> {
  const prior = profilePriors[profile] ?? (subjectType === "household" ? householdFallback : moderateBusiness);
  const high = prior.rhythm === "higher";
  const low = prior.rhythm === "lower";
  const preset = PROFILE_PRESETS[profile];
  if (subjectType === "household") {
    return {
      revenueDrop: 100,
      marginDrop: 80,
      paymentDelay: 365,
      customerLoss: 100,
      debtCall: 100,
      inventoryImpairment: 100,
      expenseIncrease: high ? 300 : low ? 180 : 240,
      incomeInterruption: profile === "Dual-income Family" ? 12 : 24,
      emergencyExpense: Math.max(100, Math.ceil(preset.monthlyRevenue * 24)),
      debtPaymentIncrease: 400,
      liquidAssetHaircut: 100,
      assetIncomeDrop: 100,
      assetIncomeInterruption: 36,
      assetValueDrop: 100,
      ...profileRangeOverrides[profile],
    };
  }
  return {
    revenueDrop: high ? 100 : low ? 75 : 90,
    marginDrop: high ? 60 : low ? 35 : 45,
    paymentDelay: high ? 540 : low ? 240 : 365,
    customerLoss: 100,
    debtCall: 100,
    inventoryImpairment: 100,
    expenseIncrease: high ? 400 : low ? 200 : 280,
    incomeInterruption: 24,
    emergencyExpense: 200,
    debtPaymentIncrease: 500,
    liquidAssetHaircut: 100,
    assetIncomeDrop: 100,
    assetIncomeInterruption: 36,
    assetValueDrop: 100,
    ...profileRangeOverrides[profile],
  };
}

export const CALIBRATION_SOURCES = [
  { label: "U.S. Census Monthly Retail Trade", url: "https://www.census.gov/retail/mrts/about_the_surveys.html" },
  { label: "U.S. Census Manufacturers' Shipments, Inventories & Orders", url: "https://www.census.gov/manufacturing/m3/about_the_surveys/index.html" },
  { label: "U.S. Census Construction Spending", url: "https://www.census.gov/construction/c30/about_the_survey.html" },
  { label: "BLS Inputs to Industry Price Indexes", url: "https://www.bls.gov/ppi/input-indexes/home.htm" },
  { label: "BEA Personal Income", url: "https://www.bea.gov/data/income-saving/personal-income" },
  { label: "Federal Reserve Household Well-Being", url: "https://www.federalreserve.gov/publications/files/2025-report-economic-well-being-us-households-202605.pdf" },
] as const;

export type IndustryReference = {
  title: string;
  signal: string;
  period: string;
  use: string;
  url: string;
};

const generalSmallBusinessReference: IndustryReference = {
  title: "NFIB Small Business Economic Trends",
  signal: "Monthly owner reports on actual sales, prices, profits, compensation, inventory, credit, and expectations.",
  period: "Monthly",
  use: "Use it to challenge direction and breadth. A net share of owners is not your company's percentage change.",
  url: "https://www.nfib.com/news/research-blog/main-street-is-okay-for-now/",
};

const referenceByProfile: Partial<Record<Profile, IndustryReference[]>> = {
  "Accommodation & Food Services": [
    {
      title: "National Restaurant Association RPI",
      signal: "The May 2026 RPI was 100.1; 50% of operators reported higher same-store sales, while 29% reported higher traffic.",
      period: "May 2026",
      use: "Compare your sales and traffic direction with operators nationally; do not copy the index level into a financial field.",
      url: "https://restaurant.org/research-and-media/research/restaurant-economic-insights/restaurant-performance-index/",
    },
    {
      title: "National Restaurant Association cost lens",
      signal: "The association estimates that total expenses for an average restaurant rose 36% from 2019 to 2026.",
      period: "2019–2026",
      use: "Use this long-run cumulative figure as context, then enter your own month-to-month food, labor, occupancy, and operating cash costs.",
      url: "https://restaurant.org/research-and-media/research/inflation/",
    },
  ],
  Construction: [
    {
      title: "Associated General Contractors cost/bid spread",
      signal: "Construction input prices rose 7.1% year over year in June 2026, versus 3.5% for bid prices.",
      period: "June 2026",
      use: "Use the spread as a margin-compression challenge, not as a substitute for your supplier invoices or awarded bids.",
      url: "https://www.agc.org/news/2026/07/15/construction-input-costs-remain-sharply-higher-year-ago-despite-june-decline-aluminum-copper-and-0",
    },
  ],
  "Construction Trades": [
    {
      title: "Associated General Contractors cost/bid spread",
      signal: "Construction input prices rose 7.1% year over year in June 2026, versus 3.5% for bid prices.",
      period: "June 2026",
      use: "Compare supplier and subcontractor cost growth with your own realized pricing power.",
      url: "https://www.agc.org/news/2026/07/15/construction-input-costs-remain-sharply-higher-year-ago-despite-june-decline-aluminum-copper-and-0",
    },
  ],
  "Transportation & Warehousing": [
    {
      title: "American Trucking Associations Tonnage Index",
      signal: "For-hire tonnage was flat in April 2026, up 4.7% since the end of 2025 and 3.5% year over year.",
      period: "April 2026",
      use: "Use tonnage as a demand-volume cross-check; enter your own loads, revenue, fuel, insurance, and maintenance costs.",
      url: "https://www.trucking.org/news-insights/ata-truck-tonnage-index-unchanged-april",
    },
  ],
  "Transportation / Gig": [
    {
      title: "American Trucking Associations Tonnage Index",
      signal: "For-hire tonnage was flat in April 2026, up 4.7% since the end of 2025 and 3.5% year over year.",
      period: "April 2026",
      use: "Use this only as a broad freight-demand comparison; gig-platform work can diverge sharply.",
      url: "https://www.trucking.org/news-insights/ata-truck-tonnage-index-unchanged-april",
    },
  ],
  Manufacturing: [
    {
      title: "U.S. Census M3",
      signal: "Monthly industry series cover shipments, new orders, backlogs, and inventories, with seasonal adjustment available.",
      period: "Monthly",
      use: "Compare your direction with the closest NAICS series and keep your own sales, margin, DSO, and inventory facts primary.",
      url: "https://www.census.gov/manufacturing/m3/currentdata.html",
    },
  ],
  "Retail Trade": [
    {
      title: "U.S. Census Monthly Retail Trade",
      signal: "Monthly estimates cover retail sales, end-of-month inventories, and inventory-to-sales ratios by kind of business.",
      period: "Monthly",
      use: "Use seasonally adjusted industry movement to question whether a short partial-year swing is seasonal or structural.",
      url: "https://www.census.gov/retail/mrts/about_the_surveys.html",
    },
  ],
  "Retail / E-commerce": [
    {
      title: "U.S. Census Monthly Retail Trade",
      signal: "Monthly estimates cover retail sales, end-of-month inventories, and inventory-to-sales ratios by kind of business.",
      period: "Monthly",
      use: "Use the closest retail category as context; channel mix, returns, ad spend, and platform fees remain company-specific.",
      url: "https://www.census.gov/retail/mrts/about_the_surveys.html",
    },
  ],
};

const householdReferences: IndustryReference[] = [
  {
    title: "BEA Personal Income and Outlays",
    signal: "Monthly national estimates separate wages, business income, dividends, interest, disposable income, outlays, and saving.",
    period: "Monthly",
    use: "Use national direction as context only. Enter your actual after-tax deposits, essential outflows, debt payments, and cash asset income.",
    url: "https://www.bea.gov/data/income-saving/personal-income",
  },
  {
    title: "Federal Reserve household well-being survey",
    signal: "The annual survey measures income variability, emergency-expense capacity, credit, housing, retirement, and financial resilience.",
    period: "Annual",
    use: "Use it to challenge buffer adequacy, not to replace your household balance sheet.",
    url: "https://www.federalreserve.gov/publications/files/2025-report-economic-well-being-us-households-202605.pdf",
  },
];

export function referencesForProfile(profile: Profile, subjectType: SubjectType): IndustryReference[] {
  if (subjectType === "household") return householdReferences;
  return [generalSmallBusinessReference, ...(referenceByProfile[profile] ?? [])];
}

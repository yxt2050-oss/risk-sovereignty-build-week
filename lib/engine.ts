export const INDUSTRIES = [
  "Manufacturing",
  "Food & Beverage",
  "Retail",
  "Construction",
  "Cross-border E-commerce",
  "Professional Services",
  "Technology",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type Locale = "zh" | "en";

export interface BusinessInputs {
  industry: Industry;
  monthlyRevenue: number;
  grossMargin: number;
  fixedCosts: number;
  cash: number;
  receivables: number;
  receivableDays: number;
  inventory: number;
  shortDebt: number;
  concentration: number;
}

export interface StressInputs {
  revenueDrop: number;
  marginDrop: number;
  paymentDelay: number;
  customerLoss: number;
  debtCall: number;
  inventoryImpairment: number;
}

export interface RiskCase {
  locale: Locale;
  business: BusinessInputs;
  stress: StressInputs;
  context?: string;
}

export type LifelineKey =
  | "cash"
  | "margin"
  | "collection"
  | "leverage"
  | "concentration";

export interface Lifeline {
  key: LifelineKey;
  score: number;
  metric: number;
  unit: "months" | "days" | "%";
}

export interface EngineResult {
  baseNetCashFlow: number;
  stressedRevenue: number;
  stressedGrossMargin: number;
  stressedNetCashFlow: number;
  monthlyBurn: number;
  collectionFreeze: number;
  debtCallShock: number;
  inventoryLoss: number;
  oneTimeShock: number;
  availableBuffer: number;
  runwayMonths: number;
  runwayCapped: boolean;
  sixMonthNeed: number;
  sixMonthPass: boolean;
  stage: "signal" | "trend" | "contagion" | "emergency";
  firstFailure: LifelineKey;
  lifelines: Lifeline[];
  calculationTrace: Array<{
    id: string;
    formula: string;
    value: number;
  }>;
  assumptions: Array<{
    id: string;
    value: string;
    editable: boolean;
  }>;
}

export const INDUSTRY_PRESETS: Record<Industry, BusinessInputs> = {
  Manufacturing: {
    industry: "Manufacturing",
    monthlyRevenue: 260,
    grossMargin: 24,
    fixedCosts: 48,
    cash: 310,
    receivables: 420,
    receivableDays: 72,
    inventory: 260,
    shortDebt: 360,
    concentration: 42,
  },
  "Food & Beverage": {
    industry: "Food & Beverage",
    monthlyRevenue: 95,
    grossMargin: 58,
    fixedCosts: 49,
    cash: 82,
    receivables: 8,
    receivableDays: 7,
    inventory: 18,
    shortDebt: 45,
    concentration: 8,
  },
  Retail: {
    industry: "Retail",
    monthlyRevenue: 145,
    grossMargin: 31,
    fixedCosts: 36,
    cash: 120,
    receivables: 22,
    receivableDays: 15,
    inventory: 150,
    shortDebt: 80,
    concentration: 12,
  },
  Construction: {
    industry: "Construction",
    monthlyRevenue: 380,
    grossMargin: 18,
    fixedCosts: 61,
    cash: 260,
    receivables: 690,
    receivableDays: 120,
    inventory: 80,
    shortDebt: 420,
    concentration: 55,
  },
  "Cross-border E-commerce": {
    industry: "Cross-border E-commerce",
    monthlyRevenue: 210,
    grossMargin: 34,
    fixedCosts: 54,
    cash: 180,
    receivables: 95,
    receivableDays: 28,
    inventory: 310,
    shortDebt: 165,
    concentration: 32,
  },
  "Professional Services": {
    industry: "Professional Services",
    monthlyRevenue: 120,
    grossMargin: 63,
    fixedCosts: 58,
    cash: 175,
    receivables: 180,
    receivableDays: 55,
    inventory: 0,
    shortDebt: 35,
    concentration: 46,
  },
  Technology: {
    industry: "Technology",
    monthlyRevenue: 88,
    grossMargin: 78,
    fixedCosts: 86,
    cash: 420,
    receivables: 72,
    receivableDays: 42,
    inventory: 5,
    shortDebt: 60,
    concentration: 38,
  },
};

export const DEFAULT_STRESS: StressInputs = {
  revenueDrop: 18,
  marginDrop: 6,
  paymentDelay: 45,
  customerLoss: 20,
  debtCall: 35,
  inventoryImpairment: 18,
};

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function normalizeRiskCase(input: RiskCase): RiskCase {
  const fallback = INDUSTRY_PRESETS.Manufacturing;
  const business = input?.business ?? fallback;
  const stress = input?.stress ?? DEFAULT_STRESS;
  const industry = INDUSTRIES.includes(business.industry)
    ? business.industry
    : fallback.industry;

  return {
    locale: input?.locale === "en" ? "en" : "zh",
    context: String(input?.context ?? "").slice(0, 1200),
    business: {
      industry,
      monthlyRevenue: clamp(business.monthlyRevenue, 0, 100000),
      grossMargin: clamp(business.grossMargin, 0, 100),
      fixedCosts: clamp(business.fixedCosts, 0, 100000),
      cash: clamp(business.cash, 0, 1000000),
      receivables: clamp(business.receivables, 0, 1000000),
      receivableDays: clamp(business.receivableDays, 0, 720),
      inventory: clamp(business.inventory, 0, 1000000),
      shortDebt: clamp(business.shortDebt, 0, 1000000),
      concentration: clamp(business.concentration, 0, 100),
    },
    stress: {
      revenueDrop: clamp(stress.revenueDrop, 0, 95),
      marginDrop: clamp(stress.marginDrop, 0, 80),
      paymentDelay: clamp(stress.paymentDelay, 0, 365),
      customerLoss: clamp(stress.customerLoss, 0, 95),
      debtCall: clamp(stress.debtCall, 0, 100),
      inventoryImpairment: clamp(stress.inventoryImpairment, 0, 100),
    },
  };
}

export function calculateStressTest(rawCase: RiskCase): EngineResult {
  const { business: b, stress: s } = normalizeRiskCase(rawCase);
  const baseGrossProfit = b.monthlyRevenue * (b.grossMargin / 100);
  const baseNetCashFlow = baseGrossProfit - b.fixedCosts;
  const stressedRevenue =
    b.monthlyRevenue * (1 - s.revenueDrop / 100) * (1 - s.customerLoss / 100);
  const stressedGrossMargin = Math.max(0, b.grossMargin - s.marginDrop);
  const stressedGrossProfit = stressedRevenue * (stressedGrossMargin / 100);
  const stressedNetCashFlow = stressedGrossProfit - b.fixedCosts;
  const monthlyBurn = Math.max(0, -stressedNetCashFlow);
  const collectionFreeze =
    b.monthlyRevenue * (s.paymentDelay / 30) +
    b.receivables * (s.customerLoss / 100);
  const debtCallShock = b.shortDebt * (s.debtCall / 100);
  const inventoryLoss = b.inventory * (s.inventoryImpairment / 100);
  const oneTimeShock = collectionFreeze + debtCallShock + inventoryLoss;
  const availableBuffer = b.cash - oneTimeShock;
  const runwayCapped = monthlyBurn < 0.01;
  const runwayMonths = runwayCapped
    ? 36
    : clamp(Math.max(0, availableBuffer) / monthlyBurn, 0, 36);
  const sixMonthNeed = b.fixedCosts * 6;
  const sixMonthPass = availableBuffer >= sixMonthNeed;

  const lifelines: Lifeline[] = [
    {
      key: "cash",
      score: clamp((Math.max(0, availableBuffer) / Math.max(1, sixMonthNeed)) * 100, 0, 100),
      metric: runwayMonths,
      unit: "months",
    },
    {
      key: "margin",
      score: clamp((stressedGrossProfit / Math.max(1, b.fixedCosts)) * 100, 0, 100),
      metric: stressedGrossMargin,
      unit: "%",
    },
    {
      key: "collection",
      score: clamp(100 - (s.paymentDelay / 120) * 72 - s.customerLoss * 0.45, 0, 100),
      metric: b.receivableDays + s.paymentDelay,
      unit: "days",
    },
    {
      key: "leverage",
      score: clamp(100 - (debtCallShock / Math.max(1, b.cash)) * 100, 0, 100),
      metric: s.debtCall,
      unit: "%",
    },
    {
      key: "concentration",
      score: clamp(100 - Math.max(b.concentration, s.customerLoss), 0, 100),
      metric: Math.max(b.concentration, s.customerLoss),
      unit: "%",
    },
  ].map(
    (item): Lifeline => ({
      ...item,
      key: item.key as LifelineKey,
      unit: item.unit as Lifeline["unit"],
      score: round(item.score),
      metric: round(item.metric),
    }),
  );

  const firstFailure = lifelines.reduce((weakest, current) =>
    current.score < weakest.score ? current : weakest,
  ).key;

  const stage =
    runwayMonths < 3
      ? "emergency"
      : runwayMonths < 6
        ? "contagion"
        : runwayMonths < 12
          ? "trend"
          : "signal";

  return {
    baseNetCashFlow: round(baseNetCashFlow),
    stressedRevenue: round(stressedRevenue),
    stressedGrossMargin: round(stressedGrossMargin),
    stressedNetCashFlow: round(stressedNetCashFlow),
    monthlyBurn: round(monthlyBurn),
    collectionFreeze: round(collectionFreeze),
    debtCallShock: round(debtCallShock),
    inventoryLoss: round(inventoryLoss),
    oneTimeShock: round(oneTimeShock),
    availableBuffer: round(availableBuffer),
    runwayMonths: round(runwayMonths),
    runwayCapped,
    sixMonthNeed: round(sixMonthNeed),
    sixMonthPass,
    stage,
    firstFailure,
    lifelines,
    calculationTrace: [
      {
        id: "stressed_revenue",
        formula: "revenue × (1 − market drop) × (1 − customer loss)",
        value: round(stressedRevenue),
      },
      {
        id: "monthly_cash_flow",
        formula: "stressed revenue × stressed margin − fixed costs",
        value: round(stressedNetCashFlow),
      },
      {
        id: "one_time_shock",
        formula: "collection freeze + debt call + inventory impairment",
        value: round(oneTimeShock),
      },
      {
        id: "survival_runway",
        formula: "max(0, cash − one-time shock) ÷ monthly burn",
        value: round(runwayMonths),
      },
    ],
    assumptions: [
      {
        id: "cash_only_buffer",
        value: "Receivables and inventory are not treated as immediately spendable cash.",
        editable: false,
      },
      {
        id: "collection_freeze",
        value: "Each 30-day payment delay freezes roughly one month of current revenue.",
        editable: true,
      },
      {
        id: "runway_cap",
        value: "Positive stressed cash flow is displayed as 36+ months, not infinity.",
        editable: false,
      },
    ],
  };
}

export const RISK_CASE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    locale: { type: "string", enum: ["zh", "en"] },
    context: { type: "string" },
    business: {
      type: "object",
      additionalProperties: false,
      properties: {
        industry: { type: "string", enum: [...INDUSTRIES] },
        monthlyRevenue: { type: "number" },
        grossMargin: { type: "number" },
        fixedCosts: { type: "number" },
        cash: { type: "number" },
        receivables: { type: "number" },
        receivableDays: { type: "number" },
        inventory: { type: "number" },
        shortDebt: { type: "number" },
        concentration: { type: "number" },
      },
      required: [
        "industry",
        "monthlyRevenue",
        "grossMargin",
        "fixedCosts",
        "cash",
        "receivables",
        "receivableDays",
        "inventory",
        "shortDebt",
        "concentration",
      ],
    },
    stress: {
      type: "object",
      additionalProperties: false,
      properties: {
        revenueDrop: { type: "number" },
        marginDrop: { type: "number" },
        paymentDelay: { type: "number" },
        customerLoss: { type: "number" },
        debtCall: { type: "number" },
        inventoryImpairment: { type: "number" },
      },
      required: [
        "revenueDrop",
        "marginDrop",
        "paymentDelay",
        "customerLoss",
        "debtCall",
        "inventoryImpairment",
      ],
    },
  },
  required: ["locale", "context", "business", "stress"],
} as const;

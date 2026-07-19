export const SUBJECT_TYPES = ["business", "self_employed", "household"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const BUSINESS_PROFILES = [
  "Retail Trade",
  "Professional Services",
  "Health Care & Social Assistance",
  "Other Services",
  "Construction",
  "Accommodation & Food Services",
  "Manufacturing",
  "Transportation & Warehousing",
] as const;

export const SELF_EMPLOYED_PROFILES = [
  "Professional / Freelance",
  "Personal Care & Services",
  "Construction Trades",
  "Transportation / Gig",
  "Retail / E-commerce",
  "Real Estate Services",
  "Arts / Media",
  "Home Services",
] as const;

export const HOUSEHOLD_PROFILES = [
  "Early-career Renter",
  "Single-income Household",
  "Dual-income Family",
  "Homeowner with Mortgage",
  "Wage + Gig Household",
  "Student-loan Household",
  "Near-retirement Household",
] as const;

export const PROFILES = [
  ...BUSINESS_PROFILES,
  ...SELF_EMPLOYED_PROFILES,
  ...HOUSEHOLD_PROFILES,
] as const;

export type Profile = (typeof PROFILES)[number];
export type BusinessProfile = (typeof BUSINESS_PROFILES)[number];
export type SelfEmployedProfile = (typeof SELF_EMPLOYED_PROFILES)[number];
export type HouseholdProfile = (typeof HOUSEHOLD_PROFILES)[number];
export type Locale = "zh" | "en";

export const REGIONS = ["Northeast", "Midwest", "South", "West", "Multi-region / National"] as const;
export type Region = (typeof REGIONS)[number];

export const SIZE_BANDS = [
  "Nonemployer / owner-only",
  "Micro employer (1–9)",
  "Small employer (10–99)",
  "Midsize (100–499)",
  "Large (500+)",
  "Single adult",
  "Two-adult household",
  "Family with dependents",
] as const;
export type SizeBand = (typeof SIZE_BANDS)[number];

/**
 * One deliberately flat fact model keeps the forced GPT tool call strict and
 * auditable. The UI only shows fields relevant to the selected subject type.
 * Money values are USD thousands; monthly flows are monthly unless noted.
 */
export interface SubjectInputs {
  subjectType: SubjectType;
  profile: Profile;
  sizeBand: SizeBand;
  region: Region;
  monthlyRevenue: number;
  grossMargin: number;
  fixedCosts: number;
  cash: number;
  receivables: number;
  receivableDays: number;
  inventory: number;
  shortDebt: number;
  concentration: number;
  housingPayment: number;
  monthlyDebtPayments: number;
  creditCardDebt: number;
  otherConsumerDebt: number;
  liquidInvestments: number;
}

// Retained as an exported alias so earlier integrations remain source-compatible.
export type BusinessInputs = SubjectInputs;

export interface StressInputs {
  revenueDrop: number;
  marginDrop: number;
  paymentDelay: number;
  customerLoss: number;
  debtCall: number;
  inventoryImpairment: number;
  expenseIncrease: number;
  incomeInterruption: number;
  emergencyExpense: number;
  debtPaymentIncrease: number;
  liquidAssetHaircut: number;
}

export interface RiskCase {
  locale: Locale;
  business: SubjectInputs;
  stress: StressInputs;
  context?: string;
}

export type LifelineKey = "cash" | "margin" | "collection" | "leverage" | "concentration";

export interface Lifeline {
  key: LifelineKey;
  score: number;
  metric: number;
  unit: "months" | "days" | "%";
}

export interface EngineResult {
  subjectType: SubjectType;
  baseNetCashFlow: number;
  stressedRevenue: number;
  stressedGrossMargin: number;
  stressedNetCashFlow: number;
  monthlyBurn: number;
  collectionFreeze: number;
  debtCallShock: number;
  inventoryLoss: number;
  liquidityShock: number;
  oneTimeShock: number;
  availableBuffer: number;
  runwayMonths: number;
  runwayCapped: boolean;
  sixMonthNeed: number;
  sixMonthPass: boolean;
  stage: "signal" | "trend" | "contagion" | "emergency";
  firstFailure: LifelineKey;
  lifelines: Lifeline[];
  calculationTrace: Array<{ id: string; formula: string; value: number }>;
  assumptions: Array<{ id: string; value: string; editable: boolean }>;
}

const business = (
  profile: BusinessProfile,
  values: Partial<SubjectInputs>,
): SubjectInputs => ({
  subjectType: "business",
  profile,
  sizeBand: "Small employer (10–99)",
  region: "South",
  monthlyRevenue: 0,
  grossMargin: 0,
  fixedCosts: 0,
  cash: 0,
  receivables: 0,
  receivableDays: 0,
  inventory: 0,
  shortDebt: 0,
  concentration: 0,
  housingPayment: 0,
  monthlyDebtPayments: 0,
  creditCardDebt: 0,
  otherConsumerDebt: 0,
  liquidInvestments: 0,
  ...values,
});

const selfEmployed = (
  profile: SelfEmployedProfile,
  values: Partial<SubjectInputs>,
): SubjectInputs => ({
  ...business("Professional Services", values),
  subjectType: "self_employed",
  profile,
  sizeBand: "Nonemployer / owner-only",
});

const household = (
  profile: HouseholdProfile,
  values: Partial<SubjectInputs>,
): SubjectInputs => ({
  ...business("Other Services", values),
  subjectType: "household",
  profile,
  sizeBand: "Single adult",
  grossMargin: 100,
  receivables: 0,
  receivableDays: 0,
  inventory: 0,
  shortDebt: 0,
});

export const PROFILE_PRESETS: Record<Profile, SubjectInputs> = {
  "Retail Trade": business("Retail Trade", { monthlyRevenue: 145, grossMargin: 31, fixedCosts: 36, cash: 120, receivables: 22, receivableDays: 15, inventory: 150, shortDebt: 80, concentration: 12 }),
  "Professional Services": business("Professional Services", { monthlyRevenue: 120, grossMargin: 63, fixedCosts: 58, cash: 175, receivables: 180, receivableDays: 55, shortDebt: 35, concentration: 46 }),
  "Health Care & Social Assistance": business("Health Care & Social Assistance", { monthlyRevenue: 190, grossMargin: 54, fixedCosts: 82, cash: 210, receivables: 235, receivableDays: 48, inventory: 22, shortDebt: 90, concentration: 18 }),
  "Other Services": business("Other Services", { monthlyRevenue: 78, grossMargin: 61, fixedCosts: 39, cash: 70, receivables: 14, receivableDays: 12, inventory: 11, shortDebt: 28, concentration: 10, sizeBand: "Micro employer (1–9)" }),
  Construction: business("Construction", { monthlyRevenue: 380, grossMargin: 18, fixedCosts: 61, cash: 260, receivables: 690, receivableDays: 120, inventory: 80, shortDebt: 420, concentration: 55 }),
  "Accommodation & Food Services": business("Accommodation & Food Services", { monthlyRevenue: 95, grossMargin: 58, fixedCosts: 49, cash: 82, receivables: 8, receivableDays: 7, inventory: 18, shortDebt: 45, concentration: 8 }),
  Manufacturing: business("Manufacturing", { monthlyRevenue: 260, grossMargin: 24, fixedCosts: 48, cash: 310, receivables: 420, receivableDays: 72, inventory: 260, shortDebt: 360, concentration: 42 }),
  "Transportation & Warehousing": business("Transportation & Warehousing", { monthlyRevenue: 165, grossMargin: 29, fixedCosts: 43, cash: 125, receivables: 130, receivableDays: 42, inventory: 12, shortDebt: 150, concentration: 33 }),

  "Professional / Freelance": selfEmployed("Professional / Freelance", { monthlyRevenue: 12, grossMargin: 82, fixedCosts: 6.3, cash: 21, receivables: 16, receivableDays: 45, shortDebt: 6, concentration: 50 }),
  "Personal Care & Services": selfEmployed("Personal Care & Services", { monthlyRevenue: 9, grossMargin: 68, fixedCosts: 5.2, cash: 12, receivables: 1, receivableDays: 5, inventory: 3, shortDebt: 8, concentration: 8 }),
  "Construction Trades": selfEmployed("Construction Trades", { monthlyRevenue: 18, grossMargin: 42, fixedCosts: 6.6, cash: 18, receivables: 24, receivableDays: 55, inventory: 7, shortDebt: 18, concentration: 38 }),
  "Transportation / Gig": selfEmployed("Transportation / Gig", { monthlyRevenue: 7.5, grossMargin: 55, fixedCosts: 3.8, cash: 8, receivables: 0.5, receivableDays: 7, inventory: 0, shortDebt: 22, concentration: 72 }),
  "Retail / E-commerce": selfEmployed("Retail / E-commerce", { monthlyRevenue: 14, grossMargin: 36, fixedCosts: 4.2, cash: 11, receivables: 2, receivableDays: 10, inventory: 18, shortDebt: 12, concentration: 35 }),
  "Real Estate Services": selfEmployed("Real Estate Services", { monthlyRevenue: 13, grossMargin: 79, fixedCosts: 6.1, cash: 20, receivables: 7, receivableDays: 30, shortDebt: 9, concentration: 45 }),
  "Arts / Media": selfEmployed("Arts / Media", { monthlyRevenue: 8, grossMargin: 76, fixedCosts: 4.8, cash: 9, receivables: 9, receivableDays: 60, shortDebt: 5, concentration: 58 }),
  "Home Services": selfEmployed("Home Services", { monthlyRevenue: 11, grossMargin: 61, fixedCosts: 4.7, cash: 10, receivables: 4, receivableDays: 21, inventory: 2, shortDebt: 10, concentration: 18 }),

  "Early-career Renter": household("Early-career Renter", { monthlyRevenue: 4.6, fixedCosts: 2.1, housingPayment: 1.55, monthlyDebtPayments: 0.42, cash: 5.5, creditCardDebt: 6.3, otherConsumerDebt: 24, liquidInvestments: 4, concentration: 100 }),
  "Single-income Household": household("Single-income Household", { monthlyRevenue: 6.8, fixedCosts: 2.7, housingPayment: 2.05, monthlyDebtPayments: 0.75, cash: 13, creditCardDebt: 8.5, otherConsumerDebt: 31, liquidInvestments: 16, concentration: 100, sizeBand: "Family with dependents" }),
  "Dual-income Family": household("Dual-income Family", { monthlyRevenue: 10.5, fixedCosts: 4.1, housingPayment: 2.65, monthlyDebtPayments: 1.05, cash: 28, creditCardDebt: 9, otherConsumerDebt: 52, liquidInvestments: 38, concentration: 58, sizeBand: "Family with dependents" }),
  "Homeowner with Mortgage": household("Homeowner with Mortgage", { monthlyRevenue: 8.4, fixedCosts: 3.25, housingPayment: 2.8, monthlyDebtPayments: 0.85, cash: 20, creditCardDebt: 7.2, otherConsumerDebt: 265, liquidInvestments: 27, concentration: 72, sizeBand: "Two-adult household" }),
  "Wage + Gig Household": household("Wage + Gig Household", { monthlyRevenue: 7.2, fixedCosts: 2.9, housingPayment: 2.15, monthlyDebtPayments: 0.7, cash: 14, creditCardDebt: 8, otherConsumerDebt: 38, liquidInvestments: 13, concentration: 78, sizeBand: "Two-adult household" }),
  "Student-loan Household": household("Student-loan Household", { monthlyRevenue: 5.9, fixedCosts: 2.4, housingPayment: 1.85, monthlyDebtPayments: 0.9, cash: 9, creditCardDebt: 7.3, otherConsumerDebt: 58, liquidInvestments: 8, concentration: 100 }),
  "Near-retirement Household": household("Near-retirement Household", { monthlyRevenue: 8.2, fixedCosts: 3.2, housingPayment: 1.5, monthlyDebtPayments: 0.55, cash: 42, creditCardDebt: 4.5, otherConsumerDebt: 92, liquidInvestments: 210, concentration: 64, sizeBand: "Two-adult household" }),
};

// Business-only compatibility export used by older tests and links.
export const INDUSTRIES = BUSINESS_PROFILES;
export type Industry = BusinessProfile;
export const INDUSTRY_PRESETS = Object.fromEntries(
  BUSINESS_PROFILES.map((profile) => [profile, PROFILE_PRESETS[profile]]),
) as Record<BusinessProfile, SubjectInputs>;

export const PROFILES_BY_SUBJECT: Record<SubjectType, readonly Profile[]> = {
  business: BUSINESS_PROFILES,
  self_employed: SELF_EMPLOYED_PROFILES,
  household: HOUSEHOLD_PROFILES,
};

export const SIZE_BANDS_BY_SUBJECT: Record<SubjectType, readonly SizeBand[]> = {
  business: ["Micro employer (1–9)", "Small employer (10–99)", "Midsize (100–499)", "Large (500+)"],
  self_employed: ["Nonemployer / owner-only"],
  household: ["Single adult", "Two-adult household", "Family with dependents"],
};

export const DEFAULT_STRESS: StressInputs = {
  revenueDrop: 18,
  marginDrop: 6,
  paymentDelay: 45,
  customerLoss: 20,
  debtCall: 35,
  inventoryImpairment: 18,
  expenseIncrease: 8,
  incomeInterruption: 2,
  emergencyExpense: 4,
  debtPaymentIncrease: 15,
  liquidAssetHaircut: 12,
};

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function normalizeRiskCase(input: RiskCase): RiskCase {
  const fallback = PROFILE_PRESETS.Manufacturing;
  const raw = input?.business ?? fallback;
  const subjectType = SUBJECT_TYPES.includes(raw.subjectType) ? raw.subjectType : fallback.subjectType;
  const allowedProfiles = PROFILES_BY_SUBJECT[subjectType];
  const profile = allowedProfiles.includes(raw.profile) ? raw.profile : allowedProfiles[0];
  const preset = PROFILE_PRESETS[profile];
  const allowedSizes = SIZE_BANDS_BY_SUBJECT[subjectType];
  const stress = input?.stress ?? DEFAULT_STRESS;

  return {
    locale: input?.locale === "zh" ? "zh" : "en",
    context: String(input?.context ?? "").slice(0, 1200),
    business: {
      subjectType,
      profile,
      sizeBand: allowedSizes.includes(raw.sizeBand) ? raw.sizeBand : preset.sizeBand,
      region: REGIONS.includes(raw.region) ? raw.region : preset.region,
      monthlyRevenue: clamp(raw.monthlyRevenue, 0, 100000),
      grossMargin: subjectType === "household" ? 100 : clamp(raw.grossMargin, 0, 100),
      fixedCosts: clamp(raw.fixedCosts, 0, 100000),
      cash: clamp(raw.cash, 0, 1000000),
      receivables: clamp(raw.receivables, 0, 1000000),
      receivableDays: clamp(raw.receivableDays, 0, 720),
      inventory: clamp(raw.inventory, 0, 1000000),
      shortDebt: clamp(raw.shortDebt, 0, 1000000),
      concentration: clamp(raw.concentration, 0, 100),
      housingPayment: clamp(raw.housingPayment, 0, 100000),
      monthlyDebtPayments: clamp(raw.monthlyDebtPayments, 0, 100000),
      creditCardDebt: clamp(raw.creditCardDebt, 0, 1000000),
      otherConsumerDebt: clamp(raw.otherConsumerDebt, 0, 1000000),
      liquidInvestments: clamp(raw.liquidInvestments, 0, 1000000),
    },
    stress: {
      revenueDrop: clamp(stress.revenueDrop, 0, 100),
      marginDrop: clamp(stress.marginDrop, 0, 80),
      paymentDelay: clamp(stress.paymentDelay, 0, 365),
      customerLoss: clamp(stress.customerLoss, 0, 100),
      debtCall: clamp(stress.debtCall, 0, 100),
      inventoryImpairment: clamp(stress.inventoryImpairment, 0, 100),
      expenseIncrease: clamp(stress.expenseIncrease, 0, 100),
      incomeInterruption: clamp(stress.incomeInterruption, 0, 24),
      emergencyExpense: clamp(stress.emergencyExpense, 0, 100000),
      debtPaymentIncrease: clamp(stress.debtPaymentIncrease, 0, 200),
      liquidAssetHaircut: clamp(stress.liquidAssetHaircut, 0, 100),
    },
  };
}

function finishResult(
  subjectType: SubjectType,
  raw: Omit<EngineResult, "subjectType" | "stage" | "firstFailure">,
): EngineResult {
  const firstFailure = raw.lifelines.reduce((weakest, current) =>
    current.score < weakest.score ? current : weakest,
  ).key;
  const stage = raw.runwayMonths < 3 ? "emergency" : raw.runwayMonths < 6 ? "contagion" : raw.runwayMonths < 12 ? "trend" : "signal";
  return { subjectType, ...raw, stage, firstFailure };
}

function calculateOperatingCase(b: SubjectInputs, s: StressInputs): EngineResult {
  const baseGrossProfit = b.monthlyRevenue * (b.grossMargin / 100);
  const baseNetCashFlow = baseGrossProfit - b.fixedCosts;
  const stressedRevenue = b.monthlyRevenue * (1 - s.revenueDrop / 100) * (1 - s.customerLoss / 100);
  const stressedGrossMargin = Math.max(0, b.grossMargin - s.marginDrop);
  const stressedGrossProfit = stressedRevenue * (stressedGrossMargin / 100);
  const stressedNetCashFlow = stressedGrossProfit - b.fixedCosts;
  const monthlyBurn = Math.max(0, -stressedNetCashFlow);
  const collectionFreeze = b.monthlyRevenue * (s.paymentDelay / 30) + b.receivables * (s.customerLoss / 100);
  const debtCallShock = b.shortDebt * (s.debtCall / 100);
  const inventoryLoss = b.inventory * (s.inventoryImpairment / 100);
  const liquidityShock = collectionFreeze + debtCallShock;
  const oneTimeShock = liquidityShock + inventoryLoss;
  const availableBuffer = b.cash - liquidityShock;
  const runwayCapped = monthlyBurn < 0.01;
  const runwayMonths = runwayCapped ? 36 : clamp(Math.max(0, availableBuffer) / monthlyBurn, 0, 36);
  const sixMonthNeed = monthlyBurn * 6;
  const sixMonthPass = availableBuffer >= sixMonthNeed;
  const lifelines: Lifeline[] = [
    { key: "cash", score: sixMonthNeed < 0.01 ? (availableBuffer >= 0 ? 100 : 0) : clamp((Math.max(0, availableBuffer) / sixMonthNeed) * 100, 0, 100), metric: runwayMonths, unit: "months" },
    { key: "margin", score: clamp((stressedGrossProfit / Math.max(1, b.fixedCosts)) * 100, 0, 100), metric: stressedGrossMargin, unit: "%" },
    { key: "collection", score: clamp(100 - ((b.receivableDays + s.paymentDelay) / 150) * 75 - s.customerLoss * 0.25, 0, 100), metric: b.receivableDays + s.paymentDelay, unit: "days" },
    { key: "leverage", score: clamp(100 - (debtCallShock / Math.max(1, b.cash)) * 100, 0, 100), metric: s.debtCall, unit: "%" },
    { key: "concentration", score: clamp(100 - Math.max(b.concentration, s.customerLoss), 0, 100), metric: Math.max(b.concentration, s.customerLoss), unit: "%" },
  ].map((item): Lifeline => ({
    ...item,
    key: item.key as LifelineKey,
    unit: item.unit as Lifeline["unit"],
    score: round(item.score),
    metric: round(item.metric),
  }));

  return finishResult(b.subjectType, {
    baseNetCashFlow: round(baseNetCashFlow), stressedRevenue: round(stressedRevenue), stressedGrossMargin: round(stressedGrossMargin), stressedNetCashFlow: round(stressedNetCashFlow), monthlyBurn: round(monthlyBurn), collectionFreeze: round(collectionFreeze), debtCallShock: round(debtCallShock), inventoryLoss: round(inventoryLoss), liquidityShock: round(liquidityShock), oneTimeShock: round(oneTimeShock), availableBuffer: round(availableBuffer), runwayMonths: round(runwayMonths), runwayCapped, sixMonthNeed: round(sixMonthNeed), sixMonthPass, lifelines,
    calculationTrace: [
      { id: "stressed_revenue", formula: "revenue × (1 − market drop) × (1 − customer loss)", value: round(stressedRevenue) },
      { id: "monthly_cash_flow", formula: "stressed revenue × stressed margin − fixed cash commitments", value: round(stressedNetCashFlow) },
      { id: "liquidity_shock", formula: "collection freeze + debt due now", value: round(liquidityShock) },
      { id: "asset_impairment", formula: "inventory book cost × impairment rate (noncash in runway)", value: round(inventoryLoss) },
      { id: "survival_runway", formula: "max(0, cash − immediate liquidity shock) ÷ monthly burn", value: round(runwayMonths) },
    ],
    assumptions: [
      { id: "usd_thousands", value: "All money inputs use USD thousands; monthly flows are monthly unless labeled otherwise.", editable: false },
      { id: "cash_only_buffer", value: "Receivables and inventory are not immediately spendable cash.", editable: false },
      { id: "inventory_non_cash", value: "Inventory impairment reduces economic value but is not treated as an immediate cash outflow.", editable: false },
      { id: "collection_freeze", value: "Each 30-day payment delay freezes roughly one month of current revenue; replace with the credit-sales share when known.", editable: true },
      { id: "liquidity_screen", value: "This is a cash-liquidity screen, not a GAAP financial statement, tax return, or valuation.", editable: false },
      { id: "runway_cap", value: "Positive stressed cash flow is displayed as 36+ months, not infinity.", editable: false },
    ],
  });
}

function calculateHouseholdCase(b: SubjectInputs, s: StressInputs): EngineResult {
  const baseNetCashFlow = b.monthlyRevenue - b.fixedCosts - b.housingPayment - b.monthlyDebtPayments;
  const stressedRevenue = b.monthlyRevenue * (1 - s.revenueDrop / 100);
  const stressedEssentialCosts = b.fixedCosts * (1 + s.expenseIncrease / 100);
  const stressedDebtPayments = b.monthlyDebtPayments * (1 + s.debtPaymentIncrease / 100);
  const stressedNetCashFlow = stressedRevenue - stressedEssentialCosts - b.housingPayment - stressedDebtPayments;
  const monthlyBurn = Math.max(0, -stressedNetCashFlow);
  const interruptionShock = b.monthlyRevenue * s.incomeInterruption;
  const debtShock = (b.creditCardDebt + b.otherConsumerDebt) * (s.debtCall / 100);
  const liquidityShock = interruptionShock + s.emergencyExpense + debtShock;
  const investmentLoss = b.liquidInvestments * (s.liquidAssetHaircut / 100);
  const usableInvestments = b.liquidInvestments - investmentLoss;
  const oneTimeShock = liquidityShock + investmentLoss;
  const availableBuffer = b.cash + usableInvestments - liquidityShock;
  const runwayCapped = monthlyBurn < 0.01;
  const runwayMonths = runwayCapped ? 36 : clamp(Math.max(0, availableBuffer) / monthlyBurn, 0, 36);
  const sixMonthNeed = monthlyBurn * 6;
  const sixMonthPass = availableBuffer >= sixMonthNeed;
  const stressedDebtService = b.housingPayment + stressedDebtPayments;
  const debtServiceRatio = stressedRevenue > 0 ? (stressedDebtService / stressedRevenue) * 100 : 100;
  const housingRatio = stressedRevenue > 0 ? (b.housingPayment / stressedRevenue) * 100 : 100;
  const lifelines: Lifeline[] = [
    { key: "cash", score: sixMonthNeed < 0.01 ? (availableBuffer >= 0 ? 100 : 0) : clamp((Math.max(0, availableBuffer) / sixMonthNeed) * 100, 0, 100), metric: runwayMonths, unit: "months" },
    { key: "margin", score: clamp((stressedRevenue / Math.max(0.01, b.monthlyRevenue)) * 100 - s.incomeInterruption * 8, 0, 100), metric: 100 - s.revenueDrop, unit: "%" },
    { key: "collection", score: clamp(100 - Math.max(0, housingRatio - 25) * 2.5, 0, 100), metric: housingRatio, unit: "%" },
    { key: "leverage", score: clamp(100 - Math.max(0, debtServiceRatio - 20) * 2 - s.debtPaymentIncrease * 0.3, 0, 100), metric: debtServiceRatio, unit: "%" },
    { key: "concentration", score: clamp(100 - b.concentration, 0, 100), metric: b.concentration, unit: "%" },
  ].map((item): Lifeline => ({
    ...item,
    key: item.key as LifelineKey,
    unit: item.unit as Lifeline["unit"],
    score: round(item.score),
    metric: round(item.metric),
  }));

  return finishResult("household", {
    baseNetCashFlow: round(baseNetCashFlow), stressedRevenue: round(stressedRevenue), stressedGrossMargin: 100, stressedNetCashFlow: round(stressedNetCashFlow), monthlyBurn: round(monthlyBurn), collectionFreeze: round(interruptionShock), debtCallShock: round(debtShock), inventoryLoss: round(investmentLoss), liquidityShock: round(liquidityShock), oneTimeShock: round(oneTimeShock), availableBuffer: round(availableBuffer), runwayMonths: round(runwayMonths), runwayCapped, sixMonthNeed: round(sixMonthNeed), sixMonthPass, lifelines,
    calculationTrace: [
      { id: "stressed_income", formula: "take-home income × (1 − income reduction)", value: round(stressedRevenue) },
      { id: "monthly_cash_flow", formula: "stressed income − inflated essentials − housing − stressed debt payments", value: round(stressedNetCashFlow) },
      { id: "liquidity_shock", formula: "income interruption + emergency expense + accelerated debt", value: round(liquidityShock) },
      { id: "asset_haircut", formula: "liquid investments × market/liquidity haircut", value: round(investmentLoss) },
      { id: "survival_runway", formula: "max(0, cash + usable liquid investments − immediate shocks) ÷ monthly burn", value: round(runwayMonths) },
    ],
    assumptions: [
      { id: "usd_thousands", value: "All money inputs use USD thousands; income and payments are monthly unless labeled otherwise.", editable: false },
      { id: "take_home_income", value: "Income means spendable take-home household income after payroll withholding.", editable: true },
      { id: "liquid_investments", value: "Only assets the household could realistically access are entered as liquid investments; retirement penalties and taxes are not modeled.", editable: true },
      { id: "debt_acceleration", value: "Accelerated debt is a scenario, not a prediction; use zero unless a contractual or delinquency trigger is plausible.", editable: true },
      { id: "household_scope", value: "This is a household cash-flow screen, not individualized financial, tax, bankruptcy, benefits, or credit advice.", editable: false },
      { id: "runway_cap", value: "Positive stressed cash flow is displayed as 36+ months, not infinity.", editable: false },
    ],
  });
}

export function calculateStressTest(rawCase: RiskCase): EngineResult {
  const { business: b, stress: s } = normalizeRiskCase(rawCase);
  return b.subjectType === "household" ? calculateHouseholdCase(b, s) : calculateOperatingCase(b, s);
}

const subjectProperties = {
  subjectType: { type: "string", enum: [...SUBJECT_TYPES] },
  profile: { type: "string", enum: [...PROFILES] },
  sizeBand: { type: "string", enum: [...SIZE_BANDS] },
  region: { type: "string", enum: [...REGIONS] },
  monthlyRevenue: { type: "number" }, grossMargin: { type: "number" }, fixedCosts: { type: "number" }, cash: { type: "number" }, receivables: { type: "number" }, receivableDays: { type: "number" }, inventory: { type: "number" }, shortDebt: { type: "number" }, concentration: { type: "number" }, housingPayment: { type: "number" }, monthlyDebtPayments: { type: "number" }, creditCardDebt: { type: "number" }, otherConsumerDebt: { type: "number" }, liquidInvestments: { type: "number" },
} as const;
const stressProperties = {
  revenueDrop: { type: "number" }, marginDrop: { type: "number" }, paymentDelay: { type: "number" }, customerLoss: { type: "number" }, debtCall: { type: "number" }, inventoryImpairment: { type: "number" }, expenseIncrease: { type: "number" }, incomeInterruption: { type: "number" }, emergencyExpense: { type: "number" }, debtPaymentIncrease: { type: "number" }, liquidAssetHaircut: { type: "number" },
} as const;

export const RISK_CASE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    locale: { type: "string", enum: ["zh", "en"] },
    context: { type: "string" },
    business: { type: "object", additionalProperties: false, properties: subjectProperties, required: Object.keys(subjectProperties) },
    stress: { type: "object", additionalProperties: false, properties: stressProperties, required: Object.keys(stressProperties) },
  },
  required: ["locale", "context", "business", "stress"],
} as const;

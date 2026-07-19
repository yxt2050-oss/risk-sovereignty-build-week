"use client";

import { useMemo, useState } from "react";
import {
  calculateStressTest,
  DEFAULT_STRESS,
  PROFILE_PRESETS,
  PROFILES_BY_SUBJECT,
  REGIONS,
  SIZE_BANDS_BY_SUBJECT,
  type BusinessInputs,
  type EngineResult,
  type LifelineKey,
  type Locale,
  type Profile,
  type StressInputs,
  type SubjectType,
} from "@/lib/engine";

type AIReport = {
  summary: string;
  verdict: {
    stage: "signal" | "trend" | "contagion" | "emergency";
    first_failure: string;
    runway: string;
    why: string;
  };
  sovereignty_gate: {
    exit_right_status: "verified" | "conditional" | "absent";
    exit_reality: string;
    maximum_tolerable_loss: string;
    reentry_condition: string;
    upside_preserved: string;
    decision_quality: string;
  };
  causal_chain: Array<{
    order: number;
    event: string;
    consequence: string;
    evidence_id: string;
  }>;
  actions: Array<{
    phase: "stop_bleeding" | "preserve_exit" | "rebuild_optionality";
    trigger: string;
    action: string;
    cash_cost: string;
    reversibility: "high" | "medium" | "low";
    partial_exit: string;
    preserved_option: string;
    evidence_ids: string[];
  }>;
  critical_assumptions: Array<{
    assumption: string;
    failure_if_wrong: string;
    how_to_verify: string;
  }>;
  owner_question: string;
  disclaimer: string;
};

type Audit = {
  model: string;
  methodology: string;
  workflow: string[];
  toolResponseId: string | null;
  reportResponseId: string | null;
};

type NumericSubjectKey =
  | "monthlyRevenue" | "grossMargin" | "fixedCosts" | "cash"
  | "receivables" | "receivableDays" | "inventory" | "shortDebt"
  | "concentration" | "housingPayment" | "monthlyDebtPayments"
  | "creditCardDebt" | "otherConsumerDebt" | "liquidInvestments";

const copy = {
  zh: {
    brand: "风险主权压力测试",
    nav: ["诊断", "填数", "坏天气", "求生指南", "AI 红队", "审计层"],
    eyebrow: "RISK SOVEREIGNTY · 风险主权",
    title: "最坏情况下，哪一条命先断？",
    subtitle:
      "不预测未来。主动模拟一个坏未来，找出企业、个体经营者或家庭最先爆开的结构，再提前加固并保留分段退出权。",
    realtime: "最坏口径 · 实时精算",
    sample: "载入样例",
    unit: "金额单位：千美元（USD $000s）；流量均按月，除非另有标注",
    runway: "最坏情况下 · 还能撑",
    months: "个月",
    plus: "+",
    six: "6 个月硬测试",
    pass: "通过",
    fail: "未通过",
    monthly: "压力后月现金流",
    shock: "即时流动性冲击",
    buffer: "可动用缓冲",
    first: "最先爆点",
    lifelines: "五条命 · 最弱的先断",
    businessTitle: "① 主体事实",
    businessSub: "选择美国企业、无雇员个体经营者或个人家庭。模板只载入可修改的演示数字，不会替你预测。",
    weatherTitle: "② 坏天气",
    weatherSub: "把已经发生或你认为可能继续恶化的风险拨到预期档位。",
    subject: "压力测试对象",
    profile: "美国常见画像 / 行业",
    sizeBand: "规模 / 家庭结构（仅作语境）",
    region: "美国人口普查区域",
    subjects: { business: "企业", self_employed: "个体经营 / 自由职业", household: "个人 / 家庭" },
    fields: {
      monthlyRevenue: "月营收",
      grossMargin: "毛利率",
      fixedCosts: "月刚性支出",
      cash: "现金缓冲",
      receivables: "应收账款",
      receivableDays: "当前账期",
      inventory: "库存账面值",
      shortDebt: "短期借款",
      concentration: "最大客户占比",
      housingPayment: "月住房支出（租金 / 房贷）",
      monthlyDebtPayments: "其他月债务还款",
      creditCardDebt: "信用卡余额",
      otherConsumerDebt: "房贷 / 车贷 / 学贷等余额",
      liquidInvestments: "可变现储蓄与投资",
    },
    stresses: {
      revenueDrop: "营收下滑",
      marginDrop: "毛利率下滑",
      paymentDelay: "回款再延迟",
      customerLoss: "客户流失 / 停付",
      debtCall: "短贷被抽回",
      inventoryImpairment: "库存减值",
      expenseIncrease: "必要生活成本上涨",
      incomeInterruption: "收入完全中断",
      emergencyExpense: "医疗 / 维修等意外支出",
      debtPaymentIncrease: "月债务还款上升",
      liquidAssetHaircut: "可变现资产折价",
    },
    guideTitle: "③ 分段求生指南 · 一点一点解开",
    guideSub: "每一步只撤一部分筹码，每一步都保留下一次选择的资格。",
    stages: ["信号期", "趋势期", "传染期", "止血期"],
    stageActions: [
      ["暂停新增固定成本", "把每周现金变动设成触发器"],
      ["把采购、投放和人力降一档", "先谈短约、分期和可退条款"],
      ["出售非核心资产换时间", "隔离问题业务，不让它拖累全盘"],
      ["保核心客户、核心人员和现金", "停止用新债掩盖旧结构"],
    ],
    here: "你在这里",
    aiTitle: "④ GPT‑5.6 AI 红队",
    aiSub:
      "模型先被迫调用确定性压力测试工具，再用严格结构化输出给出因果链与分段行动。",
    contextLabel: "补充真实约束（可选）",
    contextPlaceholder: "例如：合同解约需要 45 天；主要收入来自一份工作；车辆是接单必需资产；房贷利率将在六个月后重置……",
    generate: "用 GPT‑5.6 生成加固报告",
    generating: "GPT‑5.6 正在调用压力测试工具…",
    waiting: "先让确定性引擎算清楚，再让 AI 挑战你的假设。",
    fallback: "当前未配置 API 密钥，已展示确定性引擎的本地求生草案。部署时配置后会启用真实 GPT‑5.6 工具调用。",
    verifiedSource: "真实 GPT‑5.6 结果",
    fallbackSource: "确定性本地草案",
    apiProof: "API 调用凭证",
    chain: "因果压力链",
    sovereigntyGate: "主权关卡 · 先证明退路真实存在",
    exitRight: "退出权",
    maxLoss: "最大可承受损失",
    reentry: "重新进入条件",
    upside: "保留的上行",
    decisionQuality: "决策质量",
    actions: "三段行动",
    assumptions: "关键假设",
    ownerQuestion: "留给老板的一问",
    auditTitle: "⑤ 可审计边界",
    auditSub: "把事实、假设、计算与 AI 判断分开，避免漂亮答案制造虚假确定性。",
    auditLayers: [
      ["INPUT", "主体事实", "只来自用户输入；AI 不得改写"],
      ["ASSUMPTION", "压力假设", "所有坏天气参数可见、可调"],
      ["CALC", "数值真相", "确定性公式计算现金流、冲击和跑道"],
      ["AI", "判断与解释", "GPT‑5.6 只解释、挑战并设计阶段动作"],
    ],
    formula: "计算链",
    disclaimer: "决策支持工具，不构成会计、法律、信贷或投资建议。",
  },
  en: {
    brand: "Risk Sovereignty Stress Test",
    nav: ["Diagnosis", "Inputs", "Storm", "Survival", "AI Red Team", "Audit"],
    eyebrow: "RISK SOVEREIGNTY",
    title: "What breaks first when the world stops cooperating?",
    subtitle:
      "It does not predict the future. It simulates a bad one, finds what breaks first, and helps a business, independent worker, or household reinforce that weak point without losing the right to exit in stages.",
    realtime: "Worst-case lens · live calculation",
    sample: "Load sample",
    unit: "Money unit: USD thousands ($000s); flows are monthly unless labeled otherwise",
    runway: "Worst-case survival runway",
    months: "months",
    plus: "+",
    six: "Six-month hard test",
    pass: "Pass",
    fail: "Fail",
    monthly: "Stressed monthly cash flow",
    shock: "Immediate liquidity shock",
    buffer: "Available buffer",
    first: "First failure point",
    lifelines: "Five lifelines · the weakest breaks first",
    businessTitle: "① Subject facts",
    businessSub: "Choose a U.S. employer business, nonemployer/sole proprietor, or household. Presets only load editable demo values; they never predict your future.",
    weatherTitle: "② Bad weather",
    weatherSub: "Set the risks already happening—or likely to get worse—to your expected level.",
    subject: "Stress-test subject",
    profile: "Common U.S. profile / sector",
    sizeBand: "Size / household structure (context only)",
    region: "U.S. Census region",
    subjects: { business: "Employer business", self_employed: "Independent / sole proprietor", household: "Individual / household" },
    fields: {
      monthlyRevenue: "Monthly net sales / take-home income",
      grossMargin: "Gross margin after COGS",
      fixedCosts: "Fixed cash commitments / essentials",
      cash: "Unrestricted cash",
      receivables: "Net accounts receivable",
      receivableDays: "Current DSO",
      inventory: "Inventory book value",
      shortDebt: "Debt due within 12 months",
      concentration: "Largest customer / primary income share",
      housingPayment: "Monthly rent / mortgage",
      monthlyDebtPayments: "Other monthly debt payments",
      creditCardDebt: "Credit card balance",
      otherConsumerDebt: "Mortgage / auto / student / other debt",
      liquidInvestments: "Accessible savings & investments",
    },
    stresses: {
      revenueDrop: "Revenue drop",
      marginDrop: "Margin compression",
      paymentDelay: "Additional payment delay",
      customerLoss: "Customer loss / non-payment",
      debtCall: "Short debt called",
      inventoryImpairment: "Inventory impairment",
      expenseIncrease: "Essential-cost increase",
      incomeInterruption: "Full income interruption",
      emergencyExpense: "Medical / repair emergency",
      debtPaymentIncrease: "Debt-payment increase",
      liquidAssetHaircut: "Liquid-asset haircut",
    },
    guideTitle: "③ Staged survival guide",
    guideSub: "Remove risk in pieces. Every move should preserve another choice.",
    stages: ["Signal", "Trend", "Contagion", "Emergency"],
    stageActions: [
      ["Freeze new fixed costs", "Track weekly cash triggers"],
      ["Step down procurement and hiring", "Renegotiate for shorter, reversible commitments"],
      ["Sell non-core assets for time", "Ring-fence the failing unit"],
      ["Protect core customers, people, and cash", "Stop refinancing structural loss"],
    ],
    here: "you are here",
    aiTitle: "④ GPT‑5.6 AI red team",
    aiSub:
      "The model must call the deterministic stress-test tool first, then return a strict causal chain and staged actions.",
    contextLabel: "Real-world constraints (optional)",
    contextPlaceholder: "Example: contract exit needs 45 days; one job supplies most income; the car is required for gig work; mortgage rate resets in six months…",
    generate: "Generate GPT‑5.6 survival report",
    generating: "GPT‑5.6 is calling the stress-test tool…",
    waiting: "Let the engine establish numerical truth, then let AI challenge the assumptions.",
    fallback: "No API key is configured locally, so this is a deterministic fallback plan. The deployed app enables the real GPT‑5.6 tool workflow once the server secret is set.",
    verifiedSource: "VERIFIED GPT‑5.6 RESULT",
    fallbackSource: "DETERMINISTIC FALLBACK",
    apiProof: "API call proof",
    chain: "Causal stress chain",
    sovereigntyGate: "Sovereignty gate · prove the exit is real",
    exitRight: "Exit right",
    maxLoss: "Maximum tolerable loss",
    reentry: "Re-entry condition",
    upside: "Upside preserved",
    decisionQuality: "Decision quality",
    actions: "Three staged actions",
    assumptions: "Critical assumptions",
    ownerQuestion: "One question for the owner",
    auditTitle: "⑤ Auditable boundary",
    auditSub: "Facts, assumptions, calculations, and AI judgment remain visibly separate.",
    auditLayers: [
      ["INPUT", "Subject facts", "Only user-supplied; AI cannot rewrite them"],
      ["ASSUMPTION", "Stress assumptions", "Every scenario parameter is visible and editable"],
      ["CALC", "Numerical truth", "Deterministic formulas compute cash flow, shocks, and runway"],
      ["AI", "Judgment and explanation", "GPT‑5.6 challenges assumptions and designs staged actions"],
    ],
    formula: "Calculation trace",
    disclaimer: "Decision support only—not accounting, legal, lending, or investment advice.",
  },
} as const;

const profileNames: Record<Profile, { zh: string; en: string }> = {
  "Retail Trade": { zh: "零售业", en: "Retail Trade" },
  "Professional Services": { zh: "专业、科学与技术服务", en: "Professional Services" },
  "Health Care & Social Assistance": { zh: "医疗与社会援助", en: "Health Care & Social Assistance" },
  "Other Services": { zh: "其他个人与维修服务", en: "Other Services" },
  Construction: { zh: "建筑业", en: "Construction" },
  "Accommodation & Food Services": { zh: "住宿与餐饮", en: "Accommodation & Food Services" },
  Manufacturing: { zh: "制造业", en: "Manufacturing" },
  "Transportation & Warehousing": { zh: "运输与仓储", en: "Transportation & Warehousing" },
  "Professional / Freelance": { zh: "专业服务 / 自由职业", en: "Professional / Freelance" },
  "Personal Care & Services": { zh: "个人护理与服务", en: "Personal Care & Services" },
  "Construction Trades": { zh: "建筑工种", en: "Construction Trades" },
  "Transportation / Gig": { zh: "运输 / 平台接单", en: "Transportation / Gig" },
  "Retail / E-commerce": { zh: "零售 / 电商", en: "Retail / E-commerce" },
  "Real Estate Services": { zh: "房地产服务", en: "Real Estate Services" },
  "Arts / Media": { zh: "艺术 / 媒体", en: "Arts / Media" },
  "Home Services": { zh: "家居服务", en: "Home Services" },
  "Early-career Renter": { zh: "职场初期租房者", en: "Early-career Renter" },
  "Single-income Household": { zh: "单收入家庭", en: "Single-income Household" },
  "Dual-income Family": { zh: "双收入有孩家庭", en: "Dual-income Family" },
  "Homeowner with Mortgage": { zh: "有房贷家庭", en: "Homeowner with Mortgage" },
  "Wage + Gig Household": { zh: "工资 + 零工家庭", en: "Wage + Gig Household" },
  "Student-loan Household": { zh: "学生贷款家庭", en: "Student-loan Household" },
  "Near-retirement Household": { zh: "临近退休家庭", en: "Near-retirement Household" },
};

const lifelineNames: Record<LifelineKey, { zh: string; en: string }> = {
  cash: { zh: "现金", en: "Cash" },
  margin: { zh: "毛利", en: "Margin" },
  collection: { zh: "回款", en: "Collection" },
  leverage: { zh: "杠杆", en: "Leverage" },
  concentration: { zh: "集中度", en: "Concentration" },
};

const householdLifelineNames: Record<LifelineKey, { zh: string; en: string }> = {
  cash: { zh: "流动缓冲", en: "Liquid buffer" },
  margin: { zh: "收入韧性", en: "Income resilience" },
  collection: { zh: "住房负担", en: "Housing burden" },
  leverage: { zh: "偿债负担", en: "Debt service" },
  concentration: { zh: "收入集中度", en: "Income concentration" },
};

const stageIndex = { signal: 0, trend: 1, contagion: 2, emergency: 3 } as const;

const exitStatusCopy = {
  verified: { zh: "已验证", en: "VERIFIED" },
  conditional: { zh: "有条件", en: "CONDITIONAL" },
  absent: { zh: "不存在", en: "ABSENT" },
} as const;

function localFallback(engine: EngineResult, locale: Locale): AIReport {
  const zh = locale === "zh";
  const names = engine.subjectType === "household" ? householdLifelineNames : lifelineNames;
  const failure = names[engine.firstFailure][locale];
  return {
    summary: zh
      ? `先别扩张。当前最弱的是${failure}，先把现金跑道和退出权保住。`
      : `Do not expand yet. ${failure} is the weakest lifeline; protect runway and an exit first.`,
    verdict: {
      stage: engine.stage,
      first_failure: failure,
      runway: `${engine.runwayMonths}${engine.runwayCapped ? "+" : ""} ${zh ? "个月" : "months"}`,
      why: zh
        ? `即时流动性冲击会吞掉 ${engine.liquidityShock} 千美元，压力后月现金流为 ${engine.stressedNetCashFlow} 千美元。`
        : `The immediate liquidity shock consumes $${engine.liquidityShock}k and stressed monthly cash flow is $${engine.stressedNetCashFlow}k.`,
    },
    sovereignty_gate: {
      exit_right_status: "conditional",
      exit_reality: zh
        ? "当前输入没有给出资产变现时间、解约条款与对手方承诺，退路只能视为有条件存在。"
        : "The inputs do not establish liquidation time, cancellation terms, or counterparty commitment, so the exit remains conditional.",
      maximum_tolerable_loss: zh
        ? `引擎算出即时流动性冲击为 ${engine.liquidityShock} 千美元，但决策者能承受的最大损失尚未填写，二者不能混为一谈。`
        : `The engine calculates a $${engine.liquidityShock}k liquidity shock, but the decision-maker's maximum tolerable loss is unspecified; the two are not interchangeable.`,
      reentry_condition: zh
        ? "压力后月现金流转正，且现金跑道稳定回到十二个月以上。"
        : "Stressed monthly cash flow turns positive and runway remains above twelve months.",
      upside_preserved: zh
        ? "保留核心客户、关键人员和一笔小额验证预算，条件改善后可分段恢复。"
        : "Keep core customers, key people, and a small validation budget for staged participation when conditions improve.",
      decision_quality: zh
        ? "当前结构把多个普通风险叠成同一现金断点；即使暂时未出事，也不能把幸运当成好决策。"
        : "The current structure stacks ordinary risks onto one cash failure point; a good recent outcome would not make that a sound process.",
    },
    causal_chain: [
      {
        order: 1,
        event: zh ? "收入与毛利同时承压" : "Revenue and margin compress together",
        consequence: zh ? "经营现金流先转弱" : "Operating cash flow weakens first",
        evidence_id: "monthly_cash_flow",
      },
      {
        order: 2,
        event: zh ? "回款冻结与抽贷叠加" : "Collection freeze and debt call stack",
        consequence: zh ? "现金缓冲被一次性削薄" : "The cash buffer is cut immediately",
        evidence_id: "liquidity_shock",
      },
      {
        order: 3,
        event: zh ? `${failure}成为第一断点` : `${failure} becomes the first failure point`,
        consequence: zh ? "未来选择开始消失" : "Future choices start disappearing",
        evidence_id: "survival_runway",
      },
    ],
    actions: [
      {
        phase: "stop_bleeding",
        trigger: zh ? "压力后月现金流转负" : "Stressed monthly cash flow turns negative",
        action: engine.subjectType === "household"
          ? (zh ? "冻结新增分期与可选支出，先保住房、医疗、通勤和最低还款。" : "Freeze new installment purchases and optional spending; protect housing, health, transport, and minimum payments first.")
          : (zh ? "暂停新增固定成本，把采购与投放先降一档。" : "Freeze new fixed costs and step down procurement and acquisition spend."),
        cash_cost: zh ? "低" : "Low",
        reversibility: "high",
        partial_exit: engine.subjectType === "household"
          ? (zh ? "先撤可逆的新增承诺，不动维持收入的核心资产。" : "Remove the newest reversible commitments without sacrificing assets required to earn income.")
          : (zh ? "先撤新增部分，不动核心业务。" : "Remove only the newest commitments; keep the core operating."),
        preserved_option: zh ? "保留三个月后的重新配置权。" : "Preserves the right to reconfigure in three months.",
        evidence_ids: ["monthly_cash_flow"],
      },
      {
        phase: "preserve_exit",
        trigger: zh ? "可动用缓冲低于六个月压力缺口" : "Available buffer falls below six months of stressed shortfall",
        action: engine.subjectType === "household"
          ? (zh ? "逐项核对住房与债务条款，优先争取可验证、不会制造更大总成本的缓冲。" : "Review housing and debt terms one by one; seek verifiable relief that does not create a larger total-cost trap.")
          : (zh ? "把租约、采购和借款改成可分段、可提前退出的结构。" : "Renegotiate leases, purchasing, and debt into staged, cancellable commitments."),
        cash_cost: zh ? "中" : "Medium",
        reversibility: "medium",
        partial_exit: zh ? "每次只处理一项敞口。" : "Exit one exposure at a time.",
        preserved_option: zh ? "避免整个系统一起陪葬。" : "Avoids an all-or-nothing failure.",
        evidence_ids: ["liquidity_shock", engine.subjectType === "household" ? "household_scope" : "cash_only_buffer"],
      },
      {
        phase: "rebuild_optionality",
        trigger: zh ? "跑道重新超过十二个月" : "Runway is restored above twelve months",
        action: zh ? "只用输得起的钱，小规模验证后再分段加码。" : "Use only affordable-to-lose capital; validate small before staged expansion.",
        cash_cost: zh ? "可控" : "Controlled",
        reversibility: "high",
        partial_exit: zh ? "先设第一撤退点再投入。" : "Define the first partial exit before investing.",
        preserved_option: zh ? "保留下一次下注资格。" : "Preserves the right to make the next bet.",
        evidence_ids: ["survival_runway", "runway_cap"],
      },
    ],
    critical_assumptions: engine.assumptions.map((item) => ({
      assumption: item.value,
      failure_if_wrong: zh ? "跑道可能被高估。" : "Runway may be overstated.",
      how_to_verify: zh ? "用真实合同、账龄和变现周期核对。" : "Verify with contracts, aging, and actual liquidation time.",
    })),
    owner_question: zh
      ? "如果明天必须撤掉一部分，你现在能只撤哪一部分？"
      : "If you had to exit only one part tomorrow, which part can actually be separated?",
    disclaimer: copy[locale].disclaimer,
  };
}

export default function RiskSovereigntyApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [business, setBusiness] = useState<BusinessInputs>({ ...PROFILE_PRESETS.Manufacturing });
  const [stress, setStress] = useState<StressInputs>({ ...DEFAULT_STRESS });
  const [context, setContext] = useState("");
  const [report, setReport] = useState<AIReport | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const t = copy[locale];

  const riskCase = useMemo(
    () => ({ locale, business, stress, context }),
    [locale, business, stress, context],
  );
  const engine = useMemo(() => calculateStressTest(riskCase), [riskCase]);
  const currentStage = stageIndex[engine.stage];
  const runwayWidth = Math.min(100, (engine.runwayMonths / 24) * 100);

  function updateBusiness<K extends keyof BusinessInputs>(key: K, value: BusinessInputs[K]) {
    setBusiness((current) => ({ ...current, [key]: value }));
    setReport(null);
    setAudit(null);
  }

  function updateStress<K extends keyof StressInputs>(key: K, value: StressInputs[K]) {
    setStress((current) => ({ ...current, [key]: value }));
    setReport(null);
    setAudit(null);
  }

  function chooseProfile(profile: Profile) {
    setBusiness({ ...PROFILE_PRESETS[profile] });
    setStress({ ...DEFAULT_STRESS });
    setReport(null);
    setAudit(null);
  }

  function chooseSubject(subjectType: SubjectType) {
    chooseProfile(PROFILES_BY_SUBJECT[subjectType][0]);
  }

  function switchLocale() {
    setLocale((current) => (current === "zh" ? "en" : "zh"));
    setReport(null);
    setAudit(null);
    setNotice("");
  }

  async function generateReport() {
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(riskCase),
      });
      const payload = (await response.json()) as {
        report?: AIReport;
        audit?: Audit;
        code?: string;
        error?: string;
      };
      if (!response.ok || !payload.report) {
        if (payload.code === "OPENAI_API_KEY_MISSING") {
          setReport(localFallback(engine, locale));
          setNotice(t.fallback);
          return;
        }
        throw new Error(payload.error || "Diagnosis failed");
      }
      setReport(payload.report);
      setAudit(payload.audit ?? null);
    } catch (error) {
      setReport(localFallback(engine, locale));
      setNotice(`${error instanceof Error ? error.message : "Diagnosis failed"} · ${t.fallback}`);
    } finally {
      setLoading(false);
    }
  }

  const operatingFields: NumericSubjectKey[] = [
    "monthlyRevenue", "grossMargin", "fixedCosts", "cash", "receivables",
    "receivableDays", "inventory", "shortDebt", "concentration",
  ];
  const householdFields: NumericSubjectKey[] = [
    "monthlyRevenue", "fixedCosts", "housingPayment", "monthlyDebtPayments",
    "cash", "liquidInvestments", "creditCardDebt", "otherConsumerDebt", "concentration",
  ];
  const fieldKeys = business.subjectType === "household" ? householdFields : operatingFields;
  const fieldConfig: Array<{
    key: NumericSubjectKey;
    min: number;
    max: number;
    step: number;
    suffix: string;
  }> = fieldKeys.map((key) => ({
    key,
    min: 0,
    max: key === "grossMargin" || key === "concentration" ? 100 : key === "receivableDays" ? 720 : 1000000,
    step: key === "grossMargin" || key === "concentration" || key === "receivableDays" ? 1 : 0.1,
    suffix: key === "grossMargin" || key === "concentration" ? "%" : key === "receivableDays" ? (locale === "zh" ? "天" : "d") : "",
  }));

  const householdFieldLabels: Partial<Record<NumericSubjectKey, { zh: string; en: string }>> = {
    monthlyRevenue: { zh: "月税后家庭收入", en: "Monthly take-home income" },
    fixedCosts: { zh: "月必要生活支出（不含住房与债务）", en: "Essential monthly spending (ex housing/debt)" },
    cash: { zh: "银行现金与活期储蓄", en: "Bank cash & on-demand savings" },
    concentration: { zh: "主要收入来源占比", en: "Primary income-source share" },
  };
  const fieldLabel = (key: NumericSubjectKey) =>
    business.subjectType === "household" && householdFieldLabels[key]
      ? householdFieldLabels[key]![locale]
      : t.fields[key];

  const operatingStress: Array<keyof StressInputs> = ["revenueDrop", "marginDrop", "paymentDelay", "customerLoss", "debtCall", "inventoryImpairment"];
  const householdStress: Array<keyof StressInputs> = ["revenueDrop", "incomeInterruption", "expenseIncrease", "emergencyExpense", "debtPaymentIncrease", "debtCall", "liquidAssetHaircut"];
  const stressKeys = business.subjectType === "household" ? householdStress : operatingStress;
  const stressConfig: Array<{
    key: keyof StressInputs;
    max: number;
    suffix: string;
  }> = stressKeys.map((key) => ({
    key,
    max: key === "paymentDelay" ? 180 : key === "marginDrop" ? 40 : key === "incomeInterruption" ? 12 : key === "emergencyExpense" ? 50 : key === "debtPaymentIncrease" ? 100 : 100,
    suffix: key === "paymentDelay" ? (locale === "zh" ? " 天" : " days") : key === "marginDrop" ? (locale === "zh" ? " 个点" : " pts") : key === "incomeInterruption" ? (locale === "zh" ? " 个月" : " months") : key === "emergencyExpense" ? "k" : "%",
  }));
  const stageActions = business.subjectType === "household"
    ? (locale === "zh"
        ? [
            ["冻结新增分期与可选支出", "每周跟踪现金缺口"],
            ["保住房、医疗、通勤和最低还款", "逐项核对可逆的合同与债务条款"],
            ["隔离高成本债务与非必要资产", "不要牺牲维持收入的核心工具"],
            ["保护现金、住所和基本保障", "停止用新债长期填补结构性缺口"],
          ]
        : [
            ["Freeze new installments and optional spend", "Track the cash shortfall weekly"],
            ["Protect housing, health, transport, and minimum payments", "Review reversible contracts and debt terms one by one"],
            ["Ring-fence high-cost debt and nonessential assets", "Do not sacrifice tools required to earn income"],
            ["Protect cash, shelter, and basic coverage", "Stop using new debt to hide a structural shortfall"],
          ])
    : t.stageActions;

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Primary">
        <a className="brand-lockup" href="#diagnosis">
          <span className="logo-orb">压</span>
          <span>{t.brand}</span>
        </a>
        <div className="nav-tabs">
          {t.nav.map((label, index) => (
            <a key={label} className={index === 0 ? "active" : ""} href={`#${["diagnosis", "inputs", "storm", "survival", "ai", "audit"][index]}`}>
              {label}
            </a>
          ))}
        </div>
        <div className="nav-spacer" />
        <span className="model-pill">GPT‑5.6 · TOOL CALL</span>
        <button className="language-toggle" onClick={switchLocale}>
          {locale === "zh" ? "EN" : "中文"}
        </button>
      </nav>

      <header className="hero-heading">
        <div>
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="heading-actions">
          <button className="ghost-button" onClick={() => chooseProfile(PROFILES_BY_SUBJECT[business.subjectType][0])}>{t.sample}</button>
          <span className="live-pill"><i />{t.realtime}</span>
        </div>
      </header>

      <section className="diagnosis-grid" id="diagnosis">
        <article className="glass-card runway-card">
          <div className="card-kicker">{t.runway}</div>
          <div className="runway-row">
            <div className={`runway-number stage-${engine.stage}`}>
              {engine.runwayMonths.toFixed(1)}{engine.runwayCapped && <sup>{t.plus}</sup>}
              <small>{t.months}</small>
            </div>
            <span className={`status-badge stage-${engine.stage}`}>{t.stages[currentStage]}</span>
          </div>
          <div className="runway-visual" aria-label={`${engine.runwayMonths} ${t.months}`}>
            <div className="orbit-grid"><i /><i /><i /><i /></div>
            <div className="runway-beam" style={{ width: `${Math.max(3, runwayWidth)}%` }} />
            <span className="beam-point" style={{ left: `${Math.min(98, Math.max(2, runwayWidth))}%` }} />
          </div>
          <div className="runway-ticks"><span>0</span><span>6</span><span>12</span><span>24+</span></div>
          <div className="metric-grid">
            <div><span>{t.monthly}</span><b className={engine.stressedNetCashFlow >= 0 ? "positive" : "negative"}>{engine.stressedNetCashFlow >= 0 ? "+" : ""}{engine.stressedNetCashFlow}</b></div>
            <div><span>{t.shock}</span><b className="negative">−{engine.liquidityShock}</b></div>
            <div><span>{t.buffer}</span><b className={engine.availableBuffer >= 0 ? "warning" : "negative"}>{engine.availableBuffer}</b></div>
            <div><span>{t.six}</span><b className={engine.sixMonthPass ? "positive" : "negative"}>{engine.sixMonthPass ? t.pass : t.fail}</b></div>
          </div>
        </article>

        <aside className="glass-card lifeline-card">
          <div className="section-title"><h2>{t.lifelines}</h2><span>{(engine.subjectType === "household" ? householdLifelineNames : lifelineNames)[engine.firstFailure][locale]}</span></div>
          <div className="lifeline-list">
            {engine.lifelines.map((life) => (
              <div className={`lifeline ${life.key === engine.firstFailure ? "weak" : ""}`} key={life.key}>
                <span>{(engine.subjectType === "household" ? householdLifelineNames : lifelineNames)[life.key][locale]}</span>
                <div><i style={{ width: `${Math.max(3, life.score)}%` }} /></div>
                <b>{life.score.toFixed(0)}</b>
              </div>
            ))}
          </div>
          <div className="failure-callout">
            <span>{t.first}</span>
            <strong>{(engine.subjectType === "household" ? householdLifelineNames : lifelineNames)[engine.firstFailure][locale]}</strong>
            <p>{locale === "zh" ? "不是最吓人的风险先发生，而是最薄弱的结构先失去选择。" : "The scariest risk is not always first. The weakest structure loses optionality first."}</p>
          </div>
          <div className="truth-strip"><span>ENGINE</span><b>Deterministic numerical truth</b></div>
        </aside>
      </section>

      <div className="unit-note">{t.unit}</div>

      <section className="control-grid">
        <article className="glass-card control-card" id="inputs">
          <div className="section-title stacked"><h2>{t.businessTitle}</h2><p>{t.businessSub}</p></div>
          <label className="field-label">{t.subject}</label>
          <div className="industry-chips">
            {(Object.keys(t.subjects) as SubjectType[]).map((subject) => (
              <button key={subject} className={business.subjectType === subject ? "selected" : ""} onClick={() => chooseSubject(subject)}>
                {t.subjects[subject]}
              </button>
            ))}
          </div>
          <label className="field-label">{t.profile}</label>
          <div className="industry-chips">
            {PROFILES_BY_SUBJECT[business.subjectType].map((profile) => (
              <button key={profile} className={business.profile === profile ? "selected" : ""} onClick={() => chooseProfile(profile)}>
                {profileNames[profile][locale]}
              </button>
            ))}
          </div>
          <div className="input-grid">
            <label className="number-field">
              <span>{t.sizeBand}</span>
              <select value={business.sizeBand} onChange={(event) => updateBusiness("sizeBand", event.target.value as BusinessInputs["sizeBand"])}>
                {SIZE_BANDS_BY_SUBJECT[business.subjectType].map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
            <label className="number-field">
              <span>{t.region}</span>
              <select value={business.region} onChange={(event) => updateBusiness("region", event.target.value as BusinessInputs["region"])}>
                {REGIONS.map((region) => <option key={region}>{region}</option>)}
              </select>
            </label>
          </div>
          <div className="input-grid">
            {fieldConfig.map(({ key, min, max, step, suffix }) => (
              <label className="number-field" key={key}>
                <span>{fieldLabel(key)}</span>
                <div>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={business[key]}
                    onChange={(event) => updateBusiness(key, Number(event.target.value))}
                  />
                  <i>{suffix}</i>
                </div>
              </label>
            ))}
          </div>
        </article>

        <article className="glass-card control-card" id="storm">
          <div className="section-title stacked"><h2>{t.weatherTitle}</h2><p>{t.weatherSub}</p></div>
          <div className="stress-list">
            {stressConfig.map(({ key, max, suffix }) => (
              <label className="stress-row" key={key}>
                <span><b>{key === "revenueDrop" && business.subjectType === "household" ? (locale === "zh" ? "月收入下降" : "Take-home income drop") : key === "debtCall" && business.subjectType === "household" ? (locale === "zh" ? "债务余额提前到期 / 催收" : "Consumer debt accelerated") : t.stresses[key]}</b><em>{stress[key]}{suffix}</em></span>
                <input
                  type="range"
                  min="0"
                  max={max}
                  step="1"
                  value={stress[key]}
                  onChange={(event) => updateStress(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
          <div className="storm-equation">
            <span>EXPOSURE</span>
            <b>{locale === "zh" ? "风险不是概率 × 恐惧，而是敞口 × 没有退路" : "Risk is exposure multiplied by the absence of an exit"}</b>
          </div>
        </article>
      </section>

      <section className="glass-card section-card" id="survival">
        <div className="section-title stacked"><h2>{t.guideTitle}</h2><p>{t.guideSub}</p></div>
        <div className="stage-grid">
          {t.stages.map((name, index) => (
            <article key={name} className={`${index === currentStage ? "current" : ""} ${index < currentStage ? "past" : ""}`}>
              <div><span>0{index + 1}</span><h3>{name}</h3>{index === currentStage && <em>{t.here}</em>}</div>
              {stageActions[index].map((action) => <p key={action}>{action}</p>)}
            </article>
          ))}
        </div>
        <div className="survival-question">
          {locale === "zh" ? "一秒自测：某个环节出问题时，你能不能只处理这一个环节——还是整个系统要一起陪葬？" : "One-second test: when one part fails, can you isolate it—or must the entire system fail with it?"}
        </div>
      </section>

      <section className="glass-card section-card ai-section" id="ai">
        <div className="ai-heading">
          <div className="section-title stacked"><h2>{t.aiTitle}</h2><p>{t.aiSub}</p></div>
          <button className="primary-button" onClick={generateReport} disabled={loading}>
            {loading ? t.generating : t.generate}
          </button>
        </div>
        <label className="context-field">
          <span>{t.contextLabel}</span>
          <textarea value={context} maxLength={1200} placeholder={t.contextPlaceholder} onChange={(event) => setContext(event.target.value)} />
        </label>
        {notice && <div className="notice">{notice}</div>}
        {!report ? (
          <div className="ai-waiting"><div className="radar"><i /><i /><i /></div><p>{t.waiting}</p></div>
        ) : (
          <div className="report-grid">
            <article className="report-summary">
              <span>{audit ? t.verifiedSource : t.fallbackSource}</span>
              <h3>{report.summary}</h3>
              <p>{report.verdict.why}</p>
              <div><b>{report.verdict.runway}</b><em>{report.verdict.first_failure}</em></div>
            </article>
            <article className="causal-card">
              <div className="micro-heading">{t.chain}</div>
              {report.causal_chain.map((item) => (
                <div className="causal-step" key={`${item.order}-${item.event}`}>
                  <span>{String(item.order).padStart(2, "0")}</span>
                  <p><b>{item.event}</b>{item.consequence}<code>{item.evidence_id}</code></p>
                </div>
              ))}
            </article>
            <article className="sovereignty-card">
              <div className="sovereignty-heading">
                <div className="micro-heading">{t.sovereigntyGate}</div>
                <span data-status={report.sovereignty_gate.exit_right_status}>
                  {exitStatusCopy[report.sovereignty_gate.exit_right_status][locale]}
                </span>
              </div>
              <dl>
                <div>
                  <dt>{t.exitRight}</dt>
                  <dd>{report.sovereignty_gate.exit_reality}</dd>
                </div>
                <div>
                  <dt>{t.maxLoss}</dt>
                  <dd>{report.sovereignty_gate.maximum_tolerable_loss}</dd>
                </div>
                <div>
                  <dt>{t.reentry}</dt>
                  <dd>{report.sovereignty_gate.reentry_condition}</dd>
                </div>
                <div>
                  <dt>{t.upside}</dt>
                  <dd>{report.sovereignty_gate.upside_preserved}</dd>
                </div>
                <div>
                  <dt>{t.decisionQuality}</dt>
                  <dd>{report.sovereignty_gate.decision_quality}</dd>
                </div>
              </dl>
            </article>
            <div className="action-stack">
              <div className="micro-heading">{t.actions}</div>
              {report.actions.map((action, index) => (
                <article key={`${action.phase}-${index}`}>
                  <div className="action-top"><span>0{index + 1}</span><b>{action.action}</b></div>
                  <dl>
                    <div><dt>TRIGGER</dt><dd>{action.trigger}</dd></div>
                    <div><dt>PARTIAL EXIT</dt><dd>{action.partial_exit}</dd></div>
                    <div><dt>NEXT OPTION</dt><dd>{action.preserved_option}</dd></div>
                  </dl>
                  <div className="evidence-tags">{action.evidence_ids.map((id) => <code key={id}>{id}</code>)}</div>
                </article>
              ))}
            </div>
            <article className="assumption-card">
              <div className="micro-heading">{t.assumptions}</div>
              {report.critical_assumptions.map((item, index) => (
                <details key={`${item.assumption}-${index}`} open={index === 0}>
                  <summary>{item.assumption}</summary>
                  <p>{item.failure_if_wrong}</p><em>{item.how_to_verify}</em>
                </details>
              ))}
              <blockquote><span>{t.ownerQuestion}</span>{report.owner_question}</blockquote>
            </article>
          </div>
        )}
        {audit && (
          <div className="api-audit">
            <span>{audit.model}</span>
            <code>{audit.methodology}</code>
            {audit.workflow.map((step) => <code key={step}>{step}</code>)}
            <small>{t.apiProof}</small>
            {audit.toolResponseId && <code title="Forced tool-call response ID">tool:{audit.toolResponseId}</code>}
            {audit.reportResponseId && <code title="Structured report response ID">report:{audit.reportResponseId}</code>}
          </div>
        )}
      </section>

      <section className="glass-card section-card" id="audit">
        <div className="section-title stacked"><h2>{t.auditTitle}</h2><p>{t.auditSub}</p></div>
        <div className="audit-grid">
          {t.auditLayers.map(([tag, title, description]) => (
            <article key={tag}><span>{tag}</span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
        <div className="calculation-trace">
          <div className="micro-heading">{t.formula}</div>
          {engine.calculationTrace.map((item) => (
            <div key={item.id}><code>{item.id}</code><span>{item.formula}</span><b>{item.value}</b></div>
          ))}
        </div>
      </section>

      <footer>
        <b>RISK SOVEREIGNTY</b>
        <span>{t.disclaimer}</span>
        <span>{locale === "zh" ? "不预测未来。控制暴露，保留退出权。" : "Do not predict the future. Control exposure. Preserve an exit."}</span>
      </footer>
    </main>
  );
}

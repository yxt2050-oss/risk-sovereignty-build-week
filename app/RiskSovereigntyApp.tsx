"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { casesForSubject, type StructuralCase } from "@/lib/caseStudies";
import {
  CALIBRATION_SCENARIOS,
  CALIBRATION_SOURCES,
  calibrateHistory,
  historyMetricsForSubject,
  makeSampleHistory,
  referencesForProfile,
  stressRangesForProfile,
  stressTemplateForProfile,
  type CalibrationScenario,
  type HistoryCalibrationResult,
  type IndustryReference,
  type HistoryMetricKey,
  type MonthlyHistoryRow,
} from "@/lib/historyCalibration";
import {
  ASSET_PROFILES,
  calculateStressTest,
  PROFILE_PRESETS,
  PROFILES_BY_SUBJECT,
  REGIONS,
  SIZE_BANDS_BY_SUBJECT,
  type BusinessInputs,
  type AssetProfile,
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
  | "creditCardDebt" | "otherConsumerDebt" | "liquidInvestments"
  | "incomeAssetValue" | "monthlyAssetIncome" | "assetCarryingCosts";

const historyCopy = {
  zh: {
    kicker: "历史校准 · 可选模块",
    title: "用真实月份，校准你的“坏天气”",
    subtitle: "填入任意两个以上月份；月份可以不连续。系统按真实时间间隔提取恶化速度，再用行业敏感度和情景乘数放大。它给出压力锚点，不冒充预测。",
    sample: "当前载入的是隔月示例，请替换成你的真实数据。金额仍以千美元计。",
    month: "月份",
    metrics: {
      revenue: "营业收入 / 到手收入",
      grossMargin: "毛利率",
      costs: "固定成本 / 必要支出",
      receivableDays: "应收账期",
      debtPayments: "月债务还款",
      assetIncome: "月资产收入",
    },
    scenarios: {
      guarded: ["普通防守", "已观察恶化 × 1.25"],
      pessimistic: ["悲观加压", "已观察恶化 × 1.50"],
      extreme: ["极端断裂", "已观察恶化 × 2.00"],
    },
    horizon: "向后加压",
    months: "个月",
    extremeLabel: "极端放大倍数",
    extremeHint: "2.0–10.0 倍；可继续往上加压，收入、毛利和资产跌幅仍以 100% 为物理上限。",
    add: "增加一个月份",
    calculate: "计算压力锚点",
    apply: "应用到坏天气滑杆",
    confidence: "数据可信度",
    rhythm: "行业变化节奏",
    observed: "首末月变化",
    recommend: "建议压力",
    trace: "中位月度恶化 × 未来月数 × 情景乘数 × 行业系数",
    floor: "行业模板底线",
    noTrend: "历史恶化较弱，使用透明的行业模板底线。",
    warnings: "解释边界",
    sources: "美国官方口径与方法来源",
    remove: "删除月份",
    howTitle: "这些数字去哪里找？",
    howSubtitle: "优先使用银行流水、工资单、POS、记账软件和月末报表；始终保持每个月的统计口径一致。",
    benchmarkTitle: "同行与市场参照",
    benchmarkSubtitle: "协会和官方数据用于校验方向与量级，不会覆盖你的数据。",
    guides: {
      revenue: "企业：POS/开票/记账软件中的净销售额，扣除折扣和退货；家庭：实际到账的税后工资、零工收入。不要把账户互转算作收入。",
      grossMargin: "（净销售额 − 销货成本）÷ 净销售额。每月保持相同的 COGS 定义，不要把固定管理费用混入。",
      costs: "企业填每月实际支付的固定现金成本，不含上面的 COGS；家庭填必要生活支出，不含住房和债务还款。",
      receivableDays: "月末应收账款 ÷ 最近月均赊销额 × 30。只有总销售额时可以近似，但应明确标注。",
      debtPayments: "填账单要求的实际月还款额，不是债务余额。可变利率或重置后的金额单独做压力。",
      assetIncome: "只填当月实际收到的租金、股息或分配，按持有成本之前统计；未实现涨跌不算现金收入。",
    },
  },
  en: {
    kicker: "HISTORY CALIBRATION · OPTIONAL",
    title: "Turn real months into a defensible bad-weather range",
    subtitle: "Enter any two or more months; gaps are allowed. The engine uses the actual time distance, extracts the adverse rate, then amplifies it with a visible scenario multiplier and profile sensitivity. This is a stress anchor, not a forecast.",
    sample: "The current rows are an every-other-month example. Replace them with your own data. Money remains in USD thousands.",
    month: "Month",
    metrics: {
      revenue: "Sales / take-home income",
      grossMargin: "Gross margin",
      costs: "Fixed costs / essentials",
      receivableDays: "Receivable days",
      debtPayments: "Monthly debt payments",
      assetIncome: "Monthly asset income",
    },
    scenarios: {
      guarded: ["Guarded", "observed deterioration × 1.25"],
      pessimistic: ["Pessimistic", "observed deterioration × 1.50"],
      extreme: ["Extreme break", "observed deterioration × 2.00"],
    },
    horizon: "Stress the next",
    months: "months",
    extremeLabel: "Extreme multiplier",
    extremeHint: "2.0–10.0×; keep pushing the break case upward while income, margin, and asset declines retain a physical 100% ceiling.",
    add: "Add another month",
    calculate: "Calculate stress anchor",
    apply: "Apply to Bad weather sliders",
    confidence: "Data confidence",
    rhythm: "Profile change rhythm",
    observed: "First-to-last change",
    recommend: "Suggested stress",
    trace: "median adverse monthly rate × horizon × scenario × profile factor",
    floor: "Profile scenario floor",
    noTrend: "Observed deterioration is weaker, so the transparent profile floor is used.",
    warnings: "Interpretation boundary",
    sources: "U.S. official measurement and method sources",
    remove: "Remove month",
    howTitle: "Where do these numbers come from?",
    howSubtitle: "Start with bank activity, payroll, POS, bookkeeping, and month-end reports. Keep the definition consistent across every month.",
    benchmarkTitle: "Peer and market references",
    benchmarkSubtitle: "Association and official data challenge direction and scale; they never overwrite your facts.",
    guides: {
      revenue: "Business: net sales from POS, invoicing, or bookkeeping after discounts and returns. Household: after-tax payroll and gig deposits actually received. Exclude transfers between your own accounts.",
      grossMargin: "(net sales − cost of goods sold) ÷ net sales. Keep the COGS definition consistent and do not mix in fixed overhead.",
      costs: "Business: recurring fixed cash costs actually paid, excluding COGS above. Household: essential spending excluding housing and debt payments.",
      receivableDays: "Month-end receivables ÷ recent average monthly credit sales × 30. Total sales may be used as an approximation only when labeled.",
      debtPayments: "Use the required monthly statement payment, not the debt balance. Stress variable-rate resets separately.",
      assetIncome: "Use rent, dividends, or distributions actually received before carrying costs. Unrealized gains are not cash income.",
    },
  },
} as const;

const copy = {
  zh: {
    brand: "风险主权压力测试",
    nav: ["诊断", "填数", "坏天气", "历史校准", "求生指南", "真实案例", "AI 红队", "审计层"],
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
    lifelines: "生命线 · 最弱的先断",
    businessTitle: "① 主体事实",
    businessSub: "选择美国企业、无雇员个体经营者或个人家庭。模板只载入可修改的演示数字，不会替你预测。",
    weatherTitle: "② 坏天气",
    weatherSub: "把已经发生或你认为可能继续恶化的风险拨到预期档位。",
    subject: "压力测试对象",
    profile: "美国常见画像 / 行业",
    sizeBand: "规模 / 家庭结构（仅作语境）",
    region: "美国人口普查区域",
    assetProfile: "产生收入的资产类型",
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
      liquidInvestments: "其他可动用储备（不含下方收入资产）",
      incomeAssetValue: "收入型资产权益 / 市值",
      monthlyAssetIncome: "月资产收入（成本前）",
      assetCarryingCosts: "月持有成本 / 债务支出",
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
      assetIncomeDrop: "资产月收入下降",
      assetIncomeInterruption: "资产收入完全中断",
      assetValueDrop: "收入型资产价值下跌",
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
    evidenceTitle: "④ 结构证据库 · 真实失败与退出",
    evidenceSub: "案例不是预测模板。它们只证明一件事：集中、杠杆、现金和退出权会怎样在同一个坏天气里连锁失效。",
    evidenceLabels: { failure: "发生了什么", trap: "为什么退不掉", lesson: "主权启示", source: "查看原始来源" },
    aiTitle: "⑤ GPT‑5.6 AI 红队",
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
    auditTitle: "⑥ 可审计边界",
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
    nav: ["Diagnosis", "Inputs", "Storm", "History", "Survival", "Cases", "AI Red Team", "Audit"],
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
    lifelines: "Lifelines · the weakest breaks first",
    businessTitle: "① Subject facts",
    businessSub: "Choose a U.S. employer business, nonemployer/sole proprietor, or household. Presets only load editable demo values; they never predict your future.",
    weatherTitle: "② Bad weather",
    weatherSub: "Set the risks already happening—or likely to get worse—to your expected level.",
    subject: "Stress-test subject",
    profile: "Common U.S. profile / sector",
    sizeBand: "Size / household structure (context only)",
    region: "U.S. Census region",
    assetProfile: "Income-producing asset type",
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
      liquidInvestments: "Other accessible reserves (exclude income assets below)",
      incomeAssetValue: "Income-asset equity / market value",
      monthlyAssetIncome: "Monthly asset income (before costs)",
      assetCarryingCosts: "Monthly carrying costs / debt service",
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
      assetIncomeDrop: "Monthly asset-income drop",
      assetIncomeInterruption: "Full asset-income interruption",
      assetValueDrop: "Income-asset value decline",
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
    evidenceTitle: "④ Structural evidence · failure and exit",
    evidenceSub: "Cases are not prediction templates. They show how concentration, leverage, cash, and exit rights can fail together in one bad future.",
    evidenceLabels: { failure: "What happened", trap: "Why exit vanished", lesson: "Sovereignty lesson", source: "Open primary source" },
    aiTitle: "⑤ GPT‑5.6 AI red team",
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
    auditTitle: "⑥ Auditable boundary",
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

const assetProfileNames: Record<AssetProfile, { zh: string; en: string }> = {
  "None / cash only": { zh: "无 / 仅现金", en: "None / cash only" },
  "Rental real estate": { zh: "出租房地产", en: "Rental real estate" },
  "Public stocks / ETFs": { zh: "上市股票 / ETF", en: "Public stocks / ETFs" },
  REITs: { zh: "房地产投资信托（REITs）", en: "REITs" },
  "Private business interest": { zh: "非上市企业权益", en: "Private business interest" },
  "Bonds / CDs / Treasuries": { zh: "债券 / 存单 / 美国国债", en: "Bonds / CDs / Treasuries" },
  "Mixed income portfolio": { zh: "混合收入型资产组合", en: "Mixed income portfolio" },
};

const chineseRegionNames: Record<BusinessInputs["region"], string> = {
  Northeast: "美国东北部",
  Midwest: "美国中西部",
  South: "美国南部",
  West: "美国西部",
  "Multi-region / National": "跨区域／全美",
};

const chineseSizeBandNames: Record<BusinessInputs["sizeBand"], string> = {
  "Nonemployer / owner-only": "无雇员／仅业主本人",
  "Micro employer (1–9)": "微型雇主（1至9人）",
  "Small employer (10–99)": "小型雇主（10至99人）",
  "Midsize (100–499)": "中型雇主（100至499人）",
  "Large (500+)": "大型雇主（500人以上）",
  "Single adult": "单身成年人",
  "Two-adult household": "双成人家庭",
  "Family with dependents": "有受抚养人的家庭",
};

const chineseAssetProfileNames: Record<AssetProfile, string> = {
  "None / cash only": "无收入型资产／仅持有现金",
  "Rental real estate": "出租型房地产",
  "Public stocks / ETFs": "上市股票／交易所交易基金（ETF）",
  REITs: "房地产投资信托（REIT）",
  "Private business interest": "非上市企业权益",
  "Bonds / CDs / Treasuries": "债券／定期存单／美国国债",
  "Mixed income portfolio": "混合收入型资产组合",
};

const chineseReferenceIdentity: Record<string, Pick<IndustryReference, "title" | "signal" | "period">> = {
  "https://www.nfib.com/news/research-blog/main-street-is-okay-for-now/": {
    title: "美国全国独立企业联合会小企业经济趋势（NFIB Small Business Economic Trends）",
    signal: "每月调查业主报告的实际销售、价格、利润、薪酬、库存、信贷和预期。",
    period: "每月",
  },
  "https://restaurant.org/research-and-media/research/restaurant-economic-insights/restaurant-performance-index/": {
    title: "美国全国餐饮协会餐厅绩效指数（National Restaurant Association RPI）",
    signal: "2026年5月餐厅绩效指数为100.1；50%的经营者报告同店销售额上升，29%报告客流量上升。",
    period: "2026年5月",
  },
  "https://restaurant.org/research-and-media/research/inflation/": {
    title: "美国全国餐饮协会成本观察（National Restaurant Association）",
    signal: "协会估计，2019年至2026年间，美国普通餐厅的总费用累计上升36%。",
    period: "2019年至2026年",
  },
  "https://www.agc.org/news/2026/07/15/construction-input-costs-remain-sharply-higher-year-ago-despite-june-decline-aluminum-copper-and-0": {
    title: "美国总承包商协会成本与报价差（Associated General Contractors）",
    signal: "2026年6月建筑投入价格同比上涨7.1%，同期投标价格上涨3.5%。",
    period: "2026年6月",
  },
  "https://www.trucking.org/news-insights/ata-truck-tonnage-index-unchanged-april": {
    title: "美国卡车运输协会货运吨位指数（American Trucking Associations Tonnage Index）",
    signal: "2026年4月雇佣货运吨位环比持平；较2025年末上升4.7%，同比上升3.5%。",
    period: "2026年4月",
  },
  "https://www.census.gov/manufacturing/m3/currentdata.html": {
    title: "美国人口普查局制造业M3调查（U.S. Census M3）",
    signal: "月度行业序列涵盖出货量、新订单、未交订单和库存，并提供季节调整数据。",
    period: "每月",
  },
  "https://www.census.gov/retail/mrts/about_the_surveys.html": {
    title: "美国人口普查局月度零售贸易调查（U.S. Census Monthly Retail Trade）",
    signal: "月度估计涵盖不同零售业态的销售额、月末库存以及库存销售比。",
    period: "每月",
  },
  "https://www.bea.gov/data/income-saving/personal-income": {
    title: "美国经济分析局个人收入与支出（BEA Personal Income and Outlays）",
    signal: "月度全国估计分别统计工资、经营收入、股息、利息、可支配收入、支出和储蓄。",
    period: "每月",
  },
  "https://www.federalreserve.gov/publications/files/2025-report-economic-well-being-us-households-202605.pdf": {
    title: "美联储家庭经济状况调查（Federal Reserve household well-being survey）",
    signal: "年度调查衡量收入波动、应对紧急支出的能力、信贷、住房、退休准备和财务韧性。",
    period: "每年",
  },
};

const chineseReferenceUses: Record<string, string> = {
  "Use it to challenge direction and breadth. A net share of owners is not your company's percentage change.": "用它核对变化方向和影响范围。业主净占比不等于你自己企业的百分比变化。",
  "Compare your sales and traffic direction with operators nationally; do not copy the index level into a financial field.": "把自己的销售额和客流方向与全美经营者对照，但不要把指数点位直接填进财务字段。",
  "Use this long-run cumulative figure as context, then enter your own month-to-month food, labor, occupancy, and operating cash costs.": "把长期累计涨幅作为背景；实际加压仍应填写自己逐月的食材、人工、场地和经营现金成本。",
  "Use the spread as a margin-compression challenge, not as a substitute for your supplier invoices or awarded bids.": "把成本与报价的差距作为毛利受压参照，不能替代自己的供应商账单和中标报价。",
  "Compare supplier and subcontractor cost growth with your own realized pricing power.": "把供应商和分包成本增速与自己真正实现的提价能力进行比较。",
  "Use tonnage as a demand-volume cross-check; enter your own loads, revenue, fuel, insurance, and maintenance costs.": "用货运吨位核对需求量方向；载货量、收入、燃油、保险和维修成本仍填写自己的数据。",
  "Use this only as a broad freight-demand comparison; gig-platform work can diverge sharply.": "它只能作为广义货运需求参照；平台接单业务可能与该指标明显背离。",
  "Compare your direction with the closest NAICS series and keep your own sales, margin, DSO, and inventory facts primary.": "与最接近的北美行业分类（NAICS）序列比较方向，但销售、毛利、应收账期和库存仍以自己的事实为准。",
  "Use seasonally adjusted industry movement to question whether a short partial-year swing is seasonal or structural.": "用季节调整后的行业变化判断短期波动更可能来自季节性还是结构性问题。",
  "Use the closest retail category as context; channel mix, returns, ad spend, and platform fees remain company-specific.": "选择最接近的零售类别作为背景；渠道结构、退货、广告支出和平台费用仍由企业自身决定。",
  "Use national direction as context only. Enter your actual after-tax deposits, essential outflows, debt payments, and cash asset income.": "全国趋势只作背景；请输入自己实际到账的税后收入、必要支出、债务还款和资产现金收入。",
  "Use it to challenge buffer adequacy, not to replace your household balance sheet.": "用它检查家庭缓冲是否足够，而不是替代自己的家庭资产负债表。",
};

const chineseCalibrationSourceNames: Record<string, string> = {
  "https://www.census.gov/retail/mrts/about_the_surveys.html": "美国人口普查局月度零售贸易调查",
  "https://www.census.gov/manufacturing/m3/about_the_surveys/index.html": "美国人口普查局制造业出货、库存与订单调查",
  "https://www.census.gov/construction/c30/about_the_survey.html": "美国人口普查局建筑支出调查",
  "https://www.bls.gov/ppi/input-indexes/home.htm": "美国劳工统计局行业投入价格指数",
  "https://www.bea.gov/data/income-saving/personal-income": "美国经济分析局个人收入统计",
  "https://www.federalreserve.gov/publications/files/2025-report-economic-well-being-us-households-202605.pdf": "美联储家庭经济状况报告",
};

const chineseCaseCopy: Record<string, { geography: string; period: string; name: string; source: string; failure?: string }> = {
  "svb-2023": { geography: "美国", period: "2023年", name: "硅谷银行（Silicon Valley Bank）", source: "美联储监察长办公室重大损失审查（Federal Reserve OIG material-loss review）" },
  "wamu-2008": { geography: "美国", period: "2008年", name: "华盛顿互惠银行（Washington Mutual）", source: "美国联邦存款保险公司2008年倒闭史料（FDIC history of the 2008 failure）" },
  "kodak-2012": { geography: "美国", period: "2012至2013年", name: "伊士曼柯达（Eastman Kodak）", source: "柯达2012年10-K年度报告／美国证券交易委员会备案（Kodak 2012 Form 10-K / SEC filing）", failure: "旧业务和遗留负担压缩流动性，最终进入美国《破产法》第11章重整（Chapter 11），而不是假装原有结构还能继续。" },
  "carillion-2018": { geography: "欧洲", period: "2018年", name: "卡里利恩集团（Carillion）", source: "英国议会联合委员会报告（U.K. Parliament joint committee report）" },
  "archegos-2021": { geography: "美国", period: "2021年", name: "阿奇戈斯资本／比尔·黄（Archegos / Bill Hwang）", source: "美国证券交易委员会起诉书与执法公告（U.S. SEC complaint and enforcement release）" },
  "nfl-income-cliff": { geography: "美国", period: "1996至2003年样本", name: "美国职业橄榄球联盟短期高收入球员群体（NFL short-income-spike cohort）", source: "美国国家经济研究局工作论文21085（NBER Working Paper 21085）" },
  "housing-double-trigger": { geography: "美国", period: "2007至2009年样本", name: "美国资不抵债房主群体（U.S. underwater-homeowner cohort）", source: "美联储消费者财务调查面板研究（Federal Reserve SCF panel research）" },
};

const chineseConfidenceNames = { low: "较低", medium: "中等", high: "较高" } as const;
const chineseRhythmNames = { lower: "较平缓", moderate: "中等", higher: "较剧烈" } as const;

const chineseCalibrationWarnings: Record<string, string> = {
  "Some stress channels have fewer than two valid observations and were left unchanged.": "部分压力通道少于两个有效观测值，因此保持原值不变。",
  "This profile is seasonal or cyclical. A partial-year trend may mix seasonality with deterioration, so the result is a stress anchor, not a forecast.": "该类型具有季节性或周期性。不到一年的趋势可能混合了季节变化与真实恶化，因此结果只是压力锚点，不是预测。",
  "Sparse history produces a low-confidence anchor. Keep the suggested sliders editable and test a wider range.": "历史数据较少，压力锚点可信度偏低。请保留滑杆可调，并测试更宽的范围。",
};

const chineseTraceNames: Record<string, string> = {
  stressed_revenue: "压力后营业收入",
  stressed_fixed_costs: "压力后固定现金成本",
  stressed_labor_income: "压力后劳动收入",
  stressed_asset_income: "压力后资产收入",
  monthly_cash_flow: "压力后月现金流",
  liquidity_shock: "即时流动性冲击",
  asset_impairment: "资产减值",
  liquid_reserve_haircut: "流动储备折价",
  income_asset_value_loss: "收入型资产价值损失",
  survival_runway: "生存跑道",
};

const chineseTraceFormulas: Record<string, string> = {
  stressed_revenue: "营业收入 ×（1－市场下滑）×（1－客户流失）",
  stressed_fixed_costs: "固定现金支出 ×（1＋成本上涨）",
  stressed_labor_income: "税后劳动收入 ×（1－收入下降）",
  stressed_asset_income: "月资产收入 ×（1－资产收入下降）",
  monthly_cash_flow: "压力后总收入－压力后必要支出－住房－债务－资产持有成本",
  liquidity_shock: "收入中断、回款冻结、紧急支出与提前到期债务的合计冲击",
  asset_impairment: "资产账面成本 × 减值比例（不直接计入现金跑道）",
  liquid_reserve_haircut: "可动用储备 × 市场或流动性折价",
  income_asset_value_loss: "收入型资产权益或市值 × 价值跌幅（经济损失，不等同现金流出）",
  survival_runway: "扣除即时冲击后的可用现金 ÷ 每月现金缺口",
};

const chineseAssumptionNames: Record<string, string> = {
  usd_thousands: "所有金额均以千美元计；除非另有标注，收入与支出均按月统计。",
  cash_only_buffer: "应收账款和库存不能当作可以立即支出的现金。",
  inventory_non_cash: "库存减值会降低经济价值，但不被视为即时现金流出。",
  collection_freeze: "每延迟30天回款，大致会冻结一个月的当期收入；已知赊销占比时应使用实际比例。",
  liquidity_screen: "这是现金流动性筛查，不是通用会计准则财务报表、纳税申报表或估值报告。",
  runway_cap: "压力后现金流为正时显示为36个月以上，而不是无穷大。",
  take_home_income: "收入指扣除工资税预扣后可以实际支出的家庭到手收入。",
  liquid_investments: "可动用储备不包括另行填写的收入型资产；模型未计算退休账户提前支取罚金和税费。",
  gross_asset_income: "月资产收入按资产债务、税费、保险、物业费、管理费、维修储备等持有成本扣除前填写。",
  asset_income_can_stop: "租金、股息、分配或非上市企业派息可能下降或中断，但持有成本仍会继续。",
  asset_value_non_cash: "资产价值下降会减少经济权益，但除非必须出售，否则不视为即时现金流出。",
  treasury_boundary: "美国国债并非在所有情境下都绝对无风险：持有到期与提前出售不同，市场价格、通胀和再投资风险仍可能存在。",
  debt_acceleration: "债务提前到期是一种压力情景，不是预测；除非合同条款或逾期触发条件具有现实可能，否则应填零。",
  household_scope: "这是家庭现金流筛查，不构成个性化财务、税务、破产、福利或信贷建议。",
};

const chineseWorkflowNames: Record<string, string> = {
  forced_function_call: "强制工具调用",
  deterministic_engine: "确定性计算引擎",
  strict_structured_output: "严格结构化输出",
  latency_balanced_reasoning: "延迟与推理平衡",
  methodology_semantic_audit: "方法论语义审计",
  argument_integrity_verified: "参数完整性已验证",
  submitted_input_preserved: "用户输入保持不变",
};

function localizedReference(reference: IndustryReference, locale: Locale): IndustryReference {
  if (locale === "en") return reference;
  const identity = chineseReferenceIdentity[reference.url];
  return {
    ...reference,
    title: identity?.title ?? reference.title,
    signal: identity?.signal ?? reference.signal,
    period: identity?.period ?? reference.period,
    use: chineseReferenceUses[reference.use] ?? reference.use,
  };
}

function localizedCase(item: StructuralCase, locale: Locale) {
  if (locale === "en") {
    return {
      geography: item.geography,
      period: item.period,
      name: item.name,
      source: item.sourceLabel,
      failure: item.failure.en,
    };
  }
  const translated = chineseCaseCopy[item.id];
  return {
    geography: translated?.geography ?? item.geography,
    period: translated?.period ?? item.period,
    name: translated?.name ?? item.name,
    source: translated?.source ?? item.sourceLabel,
    failure: translated?.failure ?? item.failure.zh,
  };
}

function chineseEvidenceName(id: string) {
  return chineseTraceNames[id] ?? id;
}

const lifelineNames: Record<LifelineKey, { zh: string; en: string }> = {
  cash: { zh: "现金", en: "Cash" },
  margin: { zh: "毛利", en: "Margin" },
  collection: { zh: "回款", en: "Collection" },
  leverage: { zh: "杠杆", en: "Leverage" },
  concentration: { zh: "集中度", en: "Concentration" },
  asset: { zh: "资产回报", en: "Asset return" },
};

const householdLifelineNames: Record<LifelineKey, { zh: string; en: string }> = {
  cash: { zh: "流动缓冲", en: "Liquid buffer" },
  margin: { zh: "收入韧性", en: "Income resilience" },
  collection: { zh: "住房负担", en: "Housing burden" },
  leverage: { zh: "偿债负担", en: "Debt service" },
  concentration: { zh: "收入集中度", en: "Income concentration" },
  asset: { zh: "资产回报", en: "Asset-return resilience" },
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
      assumption: zh ? (chineseAssumptionNames[item.id] ?? item.value) : item.value,
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
  const [stress, setStress] = useState<StressInputs>(() => stressTemplateForProfile("Manufacturing", "business"));
  const [historyRows, setHistoryRows] = useState<MonthlyHistoryRow[]>(
    () => makeSampleHistory("business", "Manufacturing"),
  );
  const [calibrationScenario, setCalibrationScenario] = useState<CalibrationScenario>("pessimistic");
  const [extremeMultiplier, setExtremeMultiplier] = useState(2);
  const [historyHorizon, setHistoryHorizon] = useState(6);
  const [calibration, setCalibration] = useState<HistoryCalibrationResult | null>(null);
  const [context, setContext] = useState("");
  const [report, setReport] = useState<AIReport | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const t = copy[locale];
  const historyText = historyCopy[locale];

  const riskCase = useMemo(
    () => ({ locale, business, stress, context }),
    [locale, business, stress, context],
  );
  const engine = useMemo(() => calculateStressTest(riskCase), [riskCase]);
  const structuralCases = useMemo(() => casesForSubject(business.subjectType), [business.subjectType]);
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
    const nextBusiness = { ...PROFILE_PRESETS[profile] };
    setBusiness(nextBusiness);
    setStress(stressTemplateForProfile(profile, nextBusiness.subjectType));
    setHistoryRows(makeSampleHistory(nextBusiness.subjectType, profile));
    setCalibration(null);
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

  function updateHistoryRow<K extends keyof MonthlyHistoryRow>(id: string, key: K, value: MonthlyHistoryRow[K]) {
    setHistoryRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    setCalibration(null);
  }

  function addHistoryRow() {
    const orderedMonths = historyRows.map(({ month }) => month).filter(Boolean).sort();
    const lastMonth = orderedMonths.at(-1) ?? "2026-05";
    const [year, month] = lastMonth.split("-").map(Number);
    const nextDate = new Date(Date.UTC(year, month, 1));
    const nextMonth = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;
    setHistoryRows((current) => [
      ...current,
      {
        id: `history-${Date.now()}`,
        month: nextMonth,
        revenue: null,
        grossMargin: null,
        costs: null,
        receivableDays: null,
        debtPayments: null,
        assetIncome: null,
      },
    ]);
    setCalibration(null);
  }

  function removeHistoryRow(id: string) {
    setHistoryRows((current) => current.filter((row) => row.id !== id));
    setCalibration(null);
  }

  function calculateHistoryAnchor() {
    setCalibration(calibrateHistory({
      rows: historyRows,
      subjectType: business.subjectType,
      profile: business.profile,
      scenario: calibrationScenario,
      horizonMonths: historyHorizon,
      extremeMultiplier,
    }));
  }

  function applyHistoryAnchor() {
    if (!calibration) return;
    setStress((current) => ({ ...current, ...calibration.recommendedStress }));
    setReport(null);
    setAudit(null);
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
    "incomeAssetValue", "monthlyAssetIncome", "assetCarryingCosts",
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
    incomeAssetValue: { zh: "收入型资产权益 / 市值（不计入流动缓冲）", en: "Income-asset equity / value (not in liquid buffer)" },
    monthlyAssetIncome: { zh: "月租金 / 股息 / 分配收入（成本前）", en: "Monthly rent / dividends / distributions (before costs)" },
    assetCarryingCosts: { zh: "月按揭 / 税费 / 保险 / 维修等持有成本", en: "Monthly mortgage / tax / insurance / upkeep carrying costs" },
  };
  const fieldLabel = (key: NumericSubjectKey) =>
    business.subjectType === "household" && householdFieldLabels[key]
      ? householdFieldLabels[key]![locale]
      : t.fields[key];

  const operatingStress: Array<keyof StressInputs> = ["revenueDrop", "marginDrop", "expenseIncrease", "paymentDelay", "customerLoss", "debtCall", "inventoryImpairment"];
  const householdStress: Array<keyof StressInputs> = ["revenueDrop", "incomeInterruption", "expenseIncrease", "emergencyExpense", "debtPaymentIncrease", "debtCall", "liquidAssetHaircut", "assetIncomeDrop", "assetIncomeInterruption", "assetValueDrop"];
  const stressKeys = business.subjectType === "household" ? householdStress : operatingStress;
  const profileStressRanges = stressRangesForProfile(business.profile, business.subjectType);
  const stressConfig: Array<{
    key: keyof StressInputs;
    max: number;
    suffix: string;
  }> = stressKeys.map((key) => ({
    key,
    max: profileStressRanges[key],
    suffix: key === "paymentDelay" ? (locale === "zh" ? " 天" : " days") : key === "marginDrop" ? (locale === "zh" ? " 个百分点" : " pts") : key === "incomeInterruption" || key === "assetIncomeInterruption" ? (locale === "zh" ? " 个月" : " months") : key === "emergencyExpense" ? (locale === "zh" ? "千美元" : "k") : "%",
  }));
  const historyMetricKeys = historyMetricsForSubject(business.subjectType);
  const profileReferences = referencesForProfile(business.profile, business.subjectType);
  const historyMetricSuffix: Record<HistoryMetricKey, string> = {
    revenue: locale === "zh" ? "千美元" : "k",
    grossMargin: "%",
    costs: locale === "zh" ? "千美元" : "k",
    receivableDays: locale === "zh" ? "天" : "d",
    debtPayments: locale === "zh" ? "千美元" : "k",
    assetIncome: locale === "zh" ? "千美元" : "k",
  };
  const stressDisplayName = (key: keyof StressInputs) => {
    if (key === "expenseIncrease" && business.subjectType !== "household") {
      return locale === "zh" ? "固定现金成本上涨" : "Fixed cash-cost increase";
    }
    if (key === "revenueDrop" && business.subjectType === "household") {
      return locale === "zh" ? "到手收入下降" : "Take-home income drop";
    }
    if (key === "debtCall" && business.subjectType === "household") {
      return locale === "zh" ? "债务余额提前到期 / 催收" : "Consumer debt accelerated";
    }
    return t.stresses[key];
  };
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
      <nav className="top-nav" aria-label={locale === "zh" ? "主导航" : "Primary"}>
        <a className="brand-lockup" href="#diagnosis">
          <span className="logo-orb">压</span>
          <span>{t.brand}</span>
        </a>
        <div className="nav-tabs">
          {t.nav.map((label, index) => (
            <a key={label} className={index === 0 ? "active" : ""} href={`#${["diagnosis", "inputs", "storm", "history-calibration", "survival", "evidence", "ai", "audit"][index]}`}>
              {locale === "zh" && index === 6 ? "智能红队" : label}
            </a>
          ))}
        </div>
        <div className="nav-spacer" />
        <span className="model-pill">{locale === "zh" ? "GPT-5.6 · 工具调用" : "GPT-5.6 · TOOL CALL"}</span>
        <button className="language-toggle" onClick={switchLocale}>
          {locale === "zh" ? "EN" : "中文"}
        </button>
      </nav>

      <header className="hero-heading">
        <div>
          <div className="eyebrow">{locale === "zh" ? "风险主权 · 压力诊断系统" : t.eyebrow}</div>
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
          <div className="truth-strip"><span>{locale === "zh" ? "计算引擎" : "ENGINE"}</span><b>{locale === "zh" ? "确定性数值结果" : "Deterministic numerical truth"}</b></div>
        </aside>
      </section>

      <div className="unit-note">{locale === "zh" ? "金额单位：千美元；除非另有标注，所有流量均按月计算" : t.unit}</div>

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
                {SIZE_BANDS_BY_SUBJECT[business.subjectType].map((size) => <option key={size} value={size}>{locale === "zh" ? chineseSizeBandNames[size] : size}</option>)}
              </select>
            </label>
            <label className="number-field">
              <span>{t.region}</span>
              <select value={business.region} onChange={(event) => updateBusiness("region", event.target.value as BusinessInputs["region"])}>
                {REGIONS.map((region) => <option key={region} value={region}>{locale === "zh" ? chineseRegionNames[region] : region}</option>)}
              </select>
            </label>
          </div>
          {business.subjectType === "household" && (
            <div className="input-grid">
              <label className="number-field" style={{ gridColumn: "1 / -1" }}>
                <span>{t.assetProfile}</span>
                <select value={business.assetProfile} onChange={(event) => updateBusiness("assetProfile", event.target.value as AssetProfile)}>
                  {ASSET_PROFILES.map((profile) => <option key={profile} value={profile}>{locale === "zh" ? chineseAssetProfileNames[profile] : assetProfileNames[profile].en}</option>)}
                </select>
              </label>
            </div>
          )}
          <div className="input-grid">
            {fieldConfig.map(({ key, min, max, step, suffix }) => (
              <label className="number-field" key={key}>
                <span title={fieldLabel(key)}>{fieldLabel(key)}</span>
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
                <span><b>{stressDisplayName(key)}</b><em>{stress[key]}{suffix}</em></span>
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
            <span>{locale === "zh" ? "风险敞口" : "EXPOSURE"}</span>
            <b>{locale === "zh" ? "风险不是概率 × 恐惧，而是敞口 × 没有退路" : "Risk is exposure multiplied by the absence of an exit"}</b>
          </div>
        </article>
      </section>

      <section className="glass-card section-card history-section" id="history-calibration">
        <div className="history-heading">
          <div className="section-title stacked">
            <span className="card-kicker">{historyText.kicker}</span>
            <h2>{historyText.title}</h2>
            <p>{historyText.subtitle}</p>
          </div>
          <div className="history-confidence-preview">
            <span>{historyText.horizon}</span>
            <label>
              <input
                type="number"
                min="1"
                max="18"
                value={historyHorizon}
                onChange={(event) => {
                  setHistoryHorizon(Math.max(1, Math.min(18, Number(event.target.value) || 1)));
                  setCalibration(null);
                }}
              />
              <i>{historyText.months}</i>
            </label>
          </div>
        </div>

        <div className="history-scenario-grid">
          {(Object.keys(CALIBRATION_SCENARIOS) as CalibrationScenario[]).map((scenario) => (
            <button
              key={scenario}
              className={calibrationScenario === scenario ? "selected" : ""}
              onClick={() => {
                setCalibrationScenario(scenario);
                setCalibration(null);
              }}
            >
              <b>{historyText.scenarios[scenario][0]}</b>
              <span>{historyText.scenarios[scenario][1]}</span>
            </button>
          ))}
        </div>
        {calibrationScenario === "extreme" && (
          <label className="extreme-control">
            <span><b>{historyText.extremeLabel}</b><small>{historyText.extremeHint}</small></span>
            <div>
              <input
                type="range"
                min="2"
                max="10"
                step="0.25"
                value={extremeMultiplier}
                onChange={(event) => {
                  setExtremeMultiplier(Number(event.target.value));
                  setCalibration(null);
                }}
              />
              <strong>{extremeMultiplier.toFixed(2)}×</strong>
            </div>
          </label>
        )}

        <div className="history-sample-note">{historyText.sample}</div>
        <div className="history-reference-grid">
          <details className="history-guide" open>
            <summary><b>{historyText.howTitle}</b><span>{historyText.howSubtitle}</span></summary>
            <div>
              {historyMetricKeys.map((metric) => (
                <article key={metric}>
                  <strong>{historyText.metrics[metric]}</strong>
                  <p>{locale === "zh" ? historyText.guides[metric].replaceAll("POS", "收银系统（POS）").replaceAll("COGS", "销货成本（COGS）") : historyText.guides[metric]}</p>
                </article>
              ))}
            </div>
          </details>
          <aside className="benchmark-panel">
            <div><b>{historyText.benchmarkTitle}</b><span>{historyText.benchmarkSubtitle}</span></div>
            {profileReferences.map((reference) => {
              const display = localizedReference(reference, locale);
              return (
                <a href={reference.url} target="_blank" rel="noreferrer" key={`${reference.title}-${reference.period}`}>
                  <span>{display.period}</span>
                  <strong>{display.title}</strong>
                  <p>{display.signal}</p>
                  <em>{display.use}</em>
                </a>
              );
            })}
          </aside>
        </div>
        <div className="history-table-wrap">
          <div className="history-table history-table-head" style={{ "--history-columns": historyMetricKeys.length } as CSSProperties}>
            <span>{historyText.month}</span>
            {historyMetricKeys.map((metric) => <span key={metric}>{historyText.metrics[metric]}</span>)}
            <span />
          </div>
          {historyRows.map((row) => (
            <div className="history-table" style={{ "--history-columns": historyMetricKeys.length } as CSSProperties} key={row.id}>
              <input
                type="month"
                value={row.month}
                aria-label={historyText.month}
                onChange={(event) => updateHistoryRow(row.id, "month", event.target.value)}
              />
              {historyMetricKeys.map((metric) => (
                <label key={metric}>
                  <input
                    type="number"
                    min="0"
                    step={metric === "grossMargin" || metric === "receivableDays" ? 1 : 0.1}
                    value={row[metric] ?? ""}
                    aria-label={`${historyText.metrics[metric]} ${row.month}`}
                    placeholder="—"
                    onChange={(event) => updateHistoryRow(
                      row.id,
                      metric,
                      event.target.value === "" ? null : Number(event.target.value),
                    )}
                  />
                  <i>{historyMetricSuffix[metric]}</i>
                </label>
              ))}
              <button className="history-remove" aria-label={historyText.remove} title={historyText.remove} onClick={() => removeHistoryRow(row.id)}>×</button>
            </div>
          ))}
        </div>

        <div className="history-actions">
          <button className="ghost-button" onClick={addHistoryRow}>+ {historyText.add}</button>
          <button className="primary-button" onClick={calculateHistoryAnchor}>{historyText.calculate}</button>
        </div>

        {calibration && (
          <div className="history-result">
            <div className="history-result-heading">
              <div>
                <span>{historyText.confidence}: <b data-confidence={calibration.confidence}>{locale === "zh" ? chineseConfidenceNames[calibration.confidence] : calibration.confidence}</b></span>
                <span>{historyText.rhythm}: <b>{locale === "zh" ? chineseRhythmNames[calibration.industryRhythm] : calibration.industryRhythm}</b></span>
                <span>×{calibration.industryFactor.toFixed(2)} {locale === "zh" ? "画像系数" : "profile"}</span>
              </div>
              <button className="primary-button" disabled={!calibration.metrics.length} onClick={applyHistoryAnchor}>{historyText.apply}</button>
            </div>

            <div className="history-result-grid">
              {calibration.metrics.map((metric) => (
                <article key={metric.metric}>
                  <span>{stressDisplayName(metric.stressKey)}</span>
                  <strong>{metric.recommendedStress}{metric.observedUnit}</strong>
                  <dl>
                    <div><dt>{historyText.observed}</dt><dd>{metric.observedChange > 0 ? "+" : ""}{metric.observedChange}{metric.observedUnit}</dd></div>
                    <div><dt>{historyText.recommend}</dt><dd>{metric.firstMonth} → {metric.lastMonth}</dd></div>
                  </dl>
                  <p>{historyText.trace}</p>
                  {metric.floorStress >= metric.trendStress && <em>{historyText.floor}: {metric.floorStress}{metric.observedUnit}. {historyText.noTrend}</em>}
                </article>
              ))}
            </div>

            {!!calibration.warnings.length && (
              <div className="history-warnings">
                <b>{historyText.warnings}</b>
                {calibration.warnings.map((warning) => <p key={warning}>{locale === "zh" ? (chineseCalibrationWarnings[warning] ?? warning) : warning}</p>)}
              </div>
            )}
          </div>
        )}

        <details className="history-sources">
          <summary>{historyText.sources}</summary>
          <div>
            {CALIBRATION_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{locale === "zh" ? (chineseCalibrationSourceNames[source.url] ?? source.label) : source.label} ↗</a>)}
          </div>
        </details>
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

      <section className="glass-card section-card evidence-section" id="evidence">
        <div className="section-title stacked">
          <h2>{t.evidenceTitle}</h2>
          <p>{t.evidenceSub}</p>
        </div>
        <div className="case-grid">
          {structuralCases.map((item) => {
            const display = localizedCase(item, locale);
            return (
              <article className="case-card" key={item.id}>
                <div className="case-heading">
                  <div><span>{display.geography}</span><span>{display.period}</span></div>
                  <h3>{display.name}</h3>
                </div>
                <dl>
                  <div><dt>{t.evidenceLabels.failure}</dt><dd>{display.failure}</dd></div>
                  <div><dt>{t.evidenceLabels.trap}</dt><dd>{item.trap[locale]}</dd></div>
                  <div><dt>{t.evidenceLabels.lesson}</dt><dd>{item.lesson[locale]}</dd></div>
                </dl>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  <span>{t.evidenceLabels.source}</span>
                  <b>{display.source}</b>
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass-card section-card ai-section" id="ai">
        <div className="ai-heading">
          <div className="section-title stacked"><h2>{locale === "zh" ? "⑥ GPT-5.6 智能红队" : t.aiTitle}</h2><p>{t.aiSub}</p></div>
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
                  <p><b>{item.event}</b>{item.consequence}<code title={item.evidence_id}>{locale === "zh" ? chineseEvidenceName(item.evidence_id) : item.evidence_id}</code></p>
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
                    <div><dt>{locale === "zh" ? "触发条件" : "TRIGGER"}</dt><dd>{action.trigger}</dd></div>
                    <div><dt>{locale === "zh" ? "分段退出" : "PARTIAL EXIT"}</dt><dd>{action.partial_exit}</dd></div>
                    <div><dt>{locale === "zh" ? "保留选择" : "NEXT OPTION"}</dt><dd>{action.preserved_option}</dd></div>
                  </dl>
                  <div className="evidence-tags">{action.evidence_ids.map((id) => <code key={id} title={id}>{locale === "zh" ? chineseEvidenceName(id) : id}</code>)}</div>
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
            <code>{locale === "zh" ? "风险主权方法论" : audit.methodology}</code>
            {audit.workflow.map((step) => <code key={step} title={step}>{locale === "zh" ? (chineseWorkflowNames[step] ?? step) : step}</code>)}
            <small>{locale === "zh" ? "接口调用凭证" : t.apiProof}</small>
            {audit.toolResponseId && <code title="Forced tool-call response ID">{locale === "zh" ? "工具调用" : "tool"}:{audit.toolResponseId}</code>}
            {audit.reportResponseId && <code title="Structured report response ID">{locale === "zh" ? "报告" : "report"}:{audit.reportResponseId}</code>}
          </div>
        )}
      </section>

      <section className="glass-card section-card" id="audit">
        <div className="section-title stacked"><h2>{t.auditTitle}</h2><p>{t.auditSub}</p></div>
        <div className="audit-grid">
          {t.auditLayers.map(([tag, title, description]) => (
            <article key={tag}><span>{locale === "zh" ? ({ INPUT: "输入", ASSUMPTION: "假设", CALC: "计算", AI: "智能判断" } as Record<string, string>)[tag] ?? tag : tag}</span><h3>{title}</h3><p>{locale === "zh" ? description.replaceAll("AI", "人工智能") : description}</p></article>
          ))}
        </div>
        <div className="calculation-trace">
          <div className="micro-heading">{t.formula}</div>
          {engine.calculationTrace.map((item) => (
            <div key={item.id}><code title={item.id}>{locale === "zh" ? chineseEvidenceName(item.id) : item.id}</code><span>{locale === "zh" ? (chineseTraceFormulas[item.id] ?? item.formula) : item.formula}</span><b>{item.value}</b></div>
          ))}
        </div>
      </section>

      <footer>
        <b>{locale === "zh" ? "风险主权" : "RISK SOVEREIGNTY"}</b>
        <span>{t.disclaimer}</span>
        <span>{locale === "zh" ? "不预测未来。控制暴露，保留退出权。" : "Do not predict the future. Control exposure. Preserve an exit."}</span>
      </footer>
    </main>
  );
}

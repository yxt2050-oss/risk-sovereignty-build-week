"use client";

import { useMemo, useState } from "react";
import {
  calculateStressTest,
  DEFAULT_STRESS,
  INDUSTRIES,
  INDUSTRY_PRESETS,
  type BusinessInputs,
  type EngineResult,
  type Industry,
  type LifelineKey,
  type Locale,
  type StressInputs,
} from "@/lib/engine";

type AIReport = {
  summary: string;
  verdict: {
    stage: "signal" | "trend" | "contagion" | "emergency";
    first_failure: string;
    runway: string;
    why: string;
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
  workflow: string[];
  toolResponseId: string | null;
  reportResponseId: string | null;
};

const copy = {
  zh: {
    brand: "企业抗压诊断系统",
    nav: ["诊断", "填数", "坏天气", "求生指南", "AI 红队", "审计层"],
    eyebrow: "RISK SOVEREIGNTY · 风险主权",
    title: "最坏情况下，哪一条命先断？",
    subtitle:
      "别人的 AI 算怎么赚最多。这里先算世界不配合你时，企业能撑多久、哪里先爆，以及怎样保留下一次选择。",
    realtime: "最坏口径 · 实时精算",
    sample: "载入样例",
    unit: "金额单位：万元（或任意一致的 10k 本币单位）",
    runway: "最坏情况下 · 还能撑",
    months: "个月",
    plus: "+",
    six: "6 个月硬测试",
    pass: "通过",
    fail: "未通过",
    monthly: "压力后月现金流",
    shock: "一次性冲击",
    buffer: "可动用缓冲",
    first: "最先爆点",
    lifelines: "五条命 · 最弱的先断",
    businessTitle: "① 企业事实",
    businessSub: "这些是你提供的事实。切换行业只会载入可修改的演示样例。",
    weatherTitle: "② 坏天气",
    weatherSub: "把已经发生或你认为可能继续恶化的风险拨到预期档位。",
    industry: "行业",
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
    },
    stresses: {
      revenueDrop: "营收下滑",
      marginDrop: "毛利率下滑",
      paymentDelay: "回款再延迟",
      customerLoss: "客户流失 / 停付",
      debtCall: "短贷被抽回",
      inventoryImpairment: "库存减值",
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
    contextLabel: "补充企业语境（可选）",
    contextPlaceholder: "例如：最大客户正在要求延长账期；设备可转卖但需要 45 天；房租还有 8 个月到期……",
    generate: "用 GPT‑5.6 生成加固报告",
    generating: "GPT‑5.6 正在调用压力测试工具…",
    waiting: "先让确定性引擎算清楚，再让 AI 挑战你的假设。",
    fallback: "当前未配置 API 密钥，已展示确定性引擎的本地求生草案。部署时配置后会启用真实 GPT‑5.6 工具调用。",
    chain: "因果压力链",
    actions: "三段行动",
    assumptions: "关键假设",
    ownerQuestion: "留给老板的一问",
    auditTitle: "⑤ 可审计边界",
    auditSub: "把事实、假设、计算与 AI 判断分开，避免漂亮答案制造虚假确定性。",
    auditLayers: [
      ["INPUT", "企业事实", "只来自用户输入；AI 不得改写"],
      ["ASSUMPTION", "压力假设", "所有坏天气参数可见、可调"],
      ["CALC", "数值真相", "确定性公式计算现金流、冲击和跑道"],
      ["AI", "判断与解释", "GPT‑5.6 只解释、挑战并设计阶段动作"],
    ],
    formula: "计算链",
    disclaimer: "决策支持工具，不构成会计、法律、信贷或投资建议。",
  },
  en: {
    brand: "Business Stress Test",
    nav: ["Diagnosis", "Inputs", "Storm", "Survival", "AI Red Team", "Audit"],
    eyebrow: "RISK SOVEREIGNTY",
    title: "What breaks first when the world stops cooperating?",
    subtitle:
      "Most AI tells you how to grow. This one finds the first failure point, the time left, and the staged exit that preserves your next move.",
    realtime: "Worst-case lens · live calculation",
    sample: "Load sample",
    unit: "Money unit: any consistent 10k local-currency unit",
    runway: "Worst-case survival runway",
    months: "months",
    plus: "+",
    six: "Six-month hard test",
    pass: "Pass",
    fail: "Fail",
    monthly: "Stressed monthly cash flow",
    shock: "One-time shock",
    buffer: "Available buffer",
    first: "First failure point",
    lifelines: "Five lifelines · the weakest breaks first",
    businessTitle: "① Business facts",
    businessSub: "Facts come from you. Industry switches only load editable demo values.",
    weatherTitle: "② Bad weather",
    weatherSub: "Set the risks already happening—or likely to get worse—to your expected level.",
    industry: "Industry",
    fields: {
      monthlyRevenue: "Monthly revenue",
      grossMargin: "Gross margin",
      fixedCosts: "Monthly fixed costs",
      cash: "Cash buffer",
      receivables: "Receivables",
      receivableDays: "Current DSO",
      inventory: "Inventory book value",
      shortDebt: "Short-term debt",
      concentration: "Largest customer share",
    },
    stresses: {
      revenueDrop: "Revenue drop",
      marginDrop: "Margin compression",
      paymentDelay: "Additional payment delay",
      customerLoss: "Customer loss / non-payment",
      debtCall: "Short debt called",
      inventoryImpairment: "Inventory impairment",
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
    contextLabel: "Business context (optional)",
    contextPlaceholder: "Example: our largest customer wants 30 more payment days; equipment can be sold but needs 45 days; lease expires in eight months…",
    generate: "Generate GPT‑5.6 survival report",
    generating: "GPT‑5.6 is calling the stress-test tool…",
    waiting: "Let the engine establish numerical truth, then let AI challenge the assumptions.",
    fallback: "No API key is configured locally, so this is a deterministic fallback plan. The deployed app enables the real GPT‑5.6 tool workflow once the server secret is set.",
    chain: "Causal stress chain",
    actions: "Three staged actions",
    assumptions: "Critical assumptions",
    ownerQuestion: "One question for the owner",
    auditTitle: "⑤ Auditable boundary",
    auditSub: "Facts, assumptions, calculations, and AI judgment remain visibly separate.",
    auditLayers: [
      ["INPUT", "Business facts", "Only user-supplied; AI cannot rewrite them"],
      ["ASSUMPTION", "Stress assumptions", "Every scenario parameter is visible and editable"],
      ["CALC", "Numerical truth", "Deterministic formulas compute cash flow, shocks, and runway"],
      ["AI", "Judgment and explanation", "GPT‑5.6 challenges assumptions and designs staged actions"],
    ],
    formula: "Calculation trace",
    disclaimer: "Decision support only—not accounting, legal, lending, or investment advice.",
  },
} as const;

const industryNames: Record<Industry, { zh: string; en: string }> = {
  Manufacturing: { zh: "制造 / 代工", en: "Manufacturing" },
  "Food & Beverage": { zh: "餐饮 / 门店", en: "Food & Beverage" },
  Retail: { zh: "零售", en: "Retail" },
  Construction: { zh: "工程 / 建筑", en: "Construction" },
  "Cross-border E-commerce": { zh: "跨境电商", en: "Cross-border E-commerce" },
  "Professional Services": { zh: "专业服务", en: "Professional Services" },
  Technology: { zh: "互联网 / 科技", en: "Technology" },
};

const lifelineNames: Record<LifelineKey, { zh: string; en: string }> = {
  cash: { zh: "现金", en: "Cash" },
  margin: { zh: "毛利", en: "Margin" },
  collection: { zh: "回款", en: "Collection" },
  leverage: { zh: "杠杆", en: "Leverage" },
  concentration: { zh: "集中度", en: "Concentration" },
};

const stageIndex = { signal: 0, trend: 1, contagion: 2, emergency: 3 } as const;

function localFallback(engine: EngineResult, locale: Locale): AIReport {
  const zh = locale === "zh";
  const failure = lifelineNames[engine.firstFailure][locale];
  return {
    summary: zh
      ? `先别扩张。当前最弱的是${failure}，先把现金跑道和退出权保住。`
      : `Do not expand yet. ${failure} is the weakest lifeline; protect runway and an exit first.`,
    verdict: {
      stage: engine.stage,
      first_failure: failure,
      runway: `${engine.runwayMonths}${engine.runwayCapped ? "+" : ""} ${zh ? "个月" : "months"}`,
      why: zh
        ? `一次性冲击会吞掉 ${engine.oneTimeShock} 个金额单位，压力后月现金流为 ${engine.stressedNetCashFlow}。`
        : `The one-time shock consumes ${engine.oneTimeShock} units and stressed monthly cash flow is ${engine.stressedNetCashFlow}.`,
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
        evidence_id: "one_time_shock",
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
        action: zh ? "暂停新增固定成本，把采购与投放先降一档。" : "Freeze new fixed costs and step down procurement and acquisition spend.",
        cash_cost: zh ? "低" : "Low",
        reversibility: "high",
        partial_exit: zh ? "先撤新增部分，不动核心业务。" : "Remove only the newest commitments; keep the core operating.",
        preserved_option: zh ? "保留三个月后的重新配置权。" : "Preserves the right to reconfigure in three months.",
        evidence_ids: ["monthly_cash_flow"],
      },
      {
        phase: "preserve_exit",
        trigger: zh ? "可动用缓冲低于六个月刚性支出" : "Available buffer falls below six months of fixed costs",
        action: zh ? "把租约、采购和借款改成可分段、可提前退出的结构。" : "Renegotiate leases, purchasing, and debt into staged, cancellable commitments.",
        cash_cost: zh ? "中" : "Medium",
        reversibility: "medium",
        partial_exit: zh ? "每次只处理一项敞口。" : "Exit one exposure at a time.",
        preserved_option: zh ? "避免整个系统一起陪葬。" : "Avoids an all-or-nothing failure.",
        evidence_ids: ["one_time_shock", "cash_only_buffer"],
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
  const [locale, setLocale] = useState<Locale>("zh");
  const [business, setBusiness] = useState<BusinessInputs>({ ...INDUSTRY_PRESETS.Manufacturing });
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

  function chooseIndustry(industry: Industry) {
    setBusiness({ ...INDUSTRY_PRESETS[industry] });
    setStress({ ...DEFAULT_STRESS });
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

  const fieldConfig: Array<{
    key: Exclude<keyof BusinessInputs, "industry">;
    min: number;
    max: number;
    step: number;
    suffix: string;
  }> = [
    { key: "monthlyRevenue", min: 0, max: 100000, step: 1, suffix: "" },
    { key: "grossMargin", min: 0, max: 100, step: 1, suffix: "%" },
    { key: "fixedCosts", min: 0, max: 100000, step: 1, suffix: "" },
    { key: "cash", min: 0, max: 1000000, step: 1, suffix: "" },
    { key: "receivables", min: 0, max: 1000000, step: 1, suffix: "" },
    { key: "receivableDays", min: 0, max: 720, step: 1, suffix: locale === "zh" ? "天" : "d" },
    { key: "inventory", min: 0, max: 1000000, step: 1, suffix: "" },
    { key: "shortDebt", min: 0, max: 1000000, step: 1, suffix: "" },
    { key: "concentration", min: 0, max: 100, step: 1, suffix: "%" },
  ];

  const stressConfig: Array<{
    key: keyof StressInputs;
    max: number;
    suffix: string;
  }> = [
    { key: "revenueDrop", max: 80, suffix: "%" },
    { key: "marginDrop", max: 40, suffix: locale === "zh" ? " 个点" : " pts" },
    { key: "paymentDelay", max: 180, suffix: locale === "zh" ? " 天" : " days" },
    { key: "customerLoss", max: 80, suffix: "%" },
    { key: "debtCall", max: 100, suffix: "%" },
    { key: "inventoryImpairment", max: 100, suffix: "%" },
  ];

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
        <button className="language-toggle" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>
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
          <button className="ghost-button" onClick={() => chooseIndustry("Manufacturing")}>{t.sample}</button>
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
            <div><span>{t.shock}</span><b className="negative">−{engine.oneTimeShock}</b></div>
            <div><span>{t.buffer}</span><b className={engine.availableBuffer >= 0 ? "warning" : "negative"}>{engine.availableBuffer}</b></div>
            <div><span>{t.six}</span><b className={engine.sixMonthPass ? "positive" : "negative"}>{engine.sixMonthPass ? t.pass : t.fail}</b></div>
          </div>
        </article>

        <aside className="glass-card lifeline-card">
          <div className="section-title"><h2>{t.lifelines}</h2><span>{lifelineNames[engine.firstFailure][locale]}</span></div>
          <div className="lifeline-list">
            {engine.lifelines.map((life) => (
              <div className={`lifeline ${life.key === engine.firstFailure ? "weak" : ""}`} key={life.key}>
                <span>{lifelineNames[life.key][locale]}</span>
                <div><i style={{ width: `${Math.max(3, life.score)}%` }} /></div>
                <b>{life.score.toFixed(0)}</b>
              </div>
            ))}
          </div>
          <div className="failure-callout">
            <span>{t.first}</span>
            <strong>{lifelineNames[engine.firstFailure][locale]}</strong>
            <p>{locale === "zh" ? "不是最吓人的风险先发生，而是最薄弱的结构先失去选择。" : "The scariest risk is not always first. The weakest structure loses optionality first."}</p>
          </div>
          <div className="truth-strip"><span>ENGINE</span><b>Deterministic numerical truth</b></div>
        </aside>
      </section>

      <div className="unit-note">{t.unit}</div>

      <section className="control-grid">
        <article className="glass-card control-card" id="inputs">
          <div className="section-title stacked"><h2>{t.businessTitle}</h2><p>{t.businessSub}</p></div>
          <label className="field-label">{t.industry}</label>
          <div className="industry-chips">
            {INDUSTRIES.map((industry) => (
              <button key={industry} className={business.industry === industry ? "selected" : ""} onClick={() => chooseIndustry(industry)}>
                {industryNames[industry][locale]}
              </button>
            ))}
          </div>
          <div className="input-grid">
            {fieldConfig.map(({ key, min, max, step, suffix }) => (
              <label className="number-field" key={key}>
                <span>{t.fields[key]}</span>
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
                <span><b>{t.stresses[key]}</b><em>{stress[key]}{suffix}</em></span>
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
              {t.stageActions[index].map((action) => <p key={action}>{action}</p>)}
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
              <span>AI VERDICT</span>
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
            <span>{audit.model}</span>{audit.workflow.map((step) => <code key={step}>{step}</code>)}
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

import type { Locale, SubjectType } from "@/lib/engine";

export type StructuralCase = {
  id: string;
  subjects: SubjectType[];
  geography: "U.S." | "Europe";
  period: string;
  name: string;
  failure: Record<Locale, string>;
  trap: Record<Locale, string>;
  lesson: Record<Locale, string>;
  sourceLabel: string;
  sourceUrl: string;
};

export const STRUCTURAL_CASES: StructuralCase[] = [
  {
    id: "svb-2023",
    subjects: ["business"],
    geography: "U.S.",
    period: "2023",
    name: "Silicon Valley Bank",
    failure: {
      zh: "客户与存款高度集中、未保险存款占比高，长期证券在加息后出现重大未实现损失。",
      en: "A concentrated customer and deposit base, a high share of uninsured deposits, and large unrealized losses on long-duration securities.",
    },
    trap: {
      zh: "资产账面上仍存在，但无法按挤兑速度变成现金；一旦信心断裂，退出窗口从几天压缩到几小时。",
      en: "Assets still existed on paper, but could not become cash at run speed; once confidence broke, the exit window compressed from days to hours.",
    },
    lesson: {
      zh: "不能只看净资产，要把资金来源集中度、变现速度与极端提款放进同一张压力表。",
      en: "Net worth was not enough: funding concentration, sale liquidity, and extreme withdrawals had to be tested together.",
    },
    sourceLabel: "Federal Reserve OIG material-loss review",
    sourceUrl: "https://oig.federalreserve.gov/reports/board-material-loss-review-silicon-valley-bank-sep2023.htm",
  },
  {
    id: "wamu-2008",
    subjects: ["business"],
    geography: "U.S.",
    period: "2008",
    name: "Washington Mutual",
    failure: {
      zh: "高风险按揭战略、薄弱承保和风险控制叠加房地产损失，随后存款快速外流。",
      en: "A high-risk mortgage strategy, weak underwriting and risk controls, housing losses, and accelerating deposit withdrawals.",
    },
    trap: {
      zh: "资产与融资都押在同一周期上；市场下跌不仅造成损失，也同时抽走了继续融资的能力。",
      en: "Assets and funding were exposed to the same cycle; falling collateral values also removed the ability to keep funding the structure.",
    },
    lesson: {
      zh: "相关性会在坏天气里突然升高。看似不同的资产、客户和融资，可能其实是一条风险链。",
      en: "Correlation rises in bad weather. Assets, customers, and funding that look separate may be one risk chain.",
    },
    sourceLabel: "FDIC history of the 2008 failure",
    sourceUrl: "https://www.fdic.gov/history/2000-2009",
  },
  {
    id: "kodak-2012",
    subjects: ["business"],
    geography: "U.S.",
    period: "2012–2013",
    name: "Eastman Kodak",
    failure: {
      zh: "旧业务和遗留负担压缩流动性，最终进入 Chapter 11 重整，而不是假装原结构还能继续。",
      en: "Legacy obligations and a deteriorating business model constrained liquidity, leading to Chapter 11 reorganization.",
    },
    trap: {
      zh: "真正危险的不是承认旧结构失败，而是拖到所有资产都只能被迫出售。",
      en: "The deeper danger was not admitting the old structure had failed; it was waiting until every asset had to be sold under pressure.",
    },
    lesson: {
      zh: "这是“分段退出”而非“全部死亡”的反例：出售非核心业务与知识产权、解决遗留负债，把资源集中到可持续核心。",
      en: "A partial-exit counterexample: monetize non-core assets, resolve legacy liabilities, and preserve the valuable operating core.",
    },
    sourceLabel: "Kodak 2012 Form 10-K / SEC filing",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/31235/000119312513101202/d495783d10k.htm",
  },
  {
    id: "carillion-2018",
    subjects: ["business"],
    geography: "Europe",
    period: "2018",
    name: "Carillion",
    failure: {
      zh: "这家英国建筑与设施管理集团清算时约有 70 亿英镑负债，却只剩 2900 万英镑现金。",
      en: "The U.K. construction and facilities group entered liquidation with nearly £7 billion of liabilities and only £29 million of cash.",
    },
    trap: {
      zh: "利润被提前确认，但利润没有转成现金；缺口靠新增债务和激进营运资金管理继续掩盖。",
      en: "Reported profit did not convert into cash; the gap was covered with more debt and aggressive working-capital management.",
    },
    lesson: {
      zh: "利润表可以讲故事，现金转换不会。应收、合同资产和债务必须共同接受坏天气测试。",
      en: "The income statement can tell a story; cash conversion cannot. Receivables, contract assets, and debt must be stressed together.",
    },
    sourceLabel: "U.K. Parliament joint committee report",
    sourceUrl: "https://publications.parliament.uk/pa/cm201719/cmselect/cmworpen/769/76904.htm",
  },
  {
    id: "archegos-2021",
    subjects: ["self_employed", "household"],
    geography: "U.S.",
    period: "2021",
    name: "Archegos / Bill Hwang",
    failure: {
      zh: "一家族办公室通过总收益互换建立高度集中、巨额杠杆敞口；核心股票下跌后无法满足追加保证金。",
      en: "A family office used total-return swaps to build highly concentrated, leveraged exposure, then could not meet margin calls when core positions fell.",
    },
    trap: {
      zh: "峰值净值很高，却没有独立于仓位之外的退出能力；同一批资产既是收益来源，也是保证金来源。",
      en: "Peak net worth was enormous, but there was no exit capacity independent of the positions; the same assets produced returns and supported margin.",
    },
    lesson: {
      zh: "高收入、高净值都不能替代缓冲。集中度、杠杆和流动性必须按同一时点同时恶化来测试。",
      en: "High income and high net worth do not replace a buffer. Concentration, leverage, and liquidity must be stressed at the same time.",
    },
    sourceLabel: "U.S. SEC complaint and enforcement release",
    sourceUrl: "https://www.sec.gov/newsroom/press-releases/2022-70",
  },
  {
    id: "nfl-income-cliff",
    subjects: ["self_employed", "household"],
    geography: "U.S.",
    period: "1996–2003 cohort",
    name: "NFL short-income-spike cohort",
    failure: {
      zh: "研究追踪职业收入高度前置的 NFL 球员：破产在退役后不久开始，并持续多年；总收入和职业长度并没有提供明显保护。",
      en: "A study of NFL players with short-lived income spikes found bankruptcy beginning soon after retirement and continuing for years; total earnings and career length offered little protection.",
    },
    trap: {
      zh: "把暂时的高收入当成永久收入，固定支出、投资和债务却按高峰期结构长期延续。",
      en: "Temporary peak income was treated as permanent while fixed spending, investments, and debt could outlive the earning window.",
    },
    lesson: {
      zh: "压力测试必须加入“收入台阶式下降”，并检验高峰期资产能否真正转化成退役后的现金跑道。",
      en: "Stress tests need an income cliff and must ask whether peak-period assets can actually become post-career runway.",
    },
    sourceLabel: "NBER Working Paper 21085",
    sourceUrl: "https://www.nber.org/papers/w21085",
  },
  {
    id: "housing-double-trigger",
    subjects: ["household"],
    geography: "U.S.",
    period: "2007–2009 cohort",
    name: "U.S. underwater-homeowner cohort",
    failure: {
      zh: "美联储研究发现，负资产叠加失业等经济冲击时，家庭尤其容易被迫搬迁或进入止赎。",
      en: "Federal Reserve research found households were especially likely to move involuntarily or face foreclosure when negative equity combined with shocks such as job loss.",
    },
    trap: {
      zh: "房价下跌本身未必致命，但它会同时封死出售和再融资两条退出路径；收入一断，现金问题立刻暴露。",
      en: "A price decline alone may not be fatal, but it can close both sale and refinancing exits; an income shock then becomes a cash emergency.",
    },
    lesson: {
      zh: "这正是“双触发”：资产折价和收入中断要分开输入，却必须共同测试退出权。",
      en: "This is the double trigger: enter asset repricing and income interruption separately, then test the exits jointly.",
    },
    sourceLabel: "Federal Reserve SCF panel research",
    sourceUrl: "https://www.federalreserve.gov/pubs/feds/2013/201353/",
  },
];

export function casesForSubject(subject: SubjectType) {
  return STRUCTURAL_CASES.filter((item) => item.subjects.includes(subject));
}

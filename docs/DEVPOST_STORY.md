## Inspiration

Most financial software asks: **How can we grow faster, earn more, or optimize the forecast?**

Risk Sovereignty starts somewhere else: **If the world stops cooperating, what breaks first?**

The system does not claim to predict the future. It lets the user construct a visible, adjustable bad future, then identifies the first point at which the structure loses its ability to choose. That first failure point is the vulnerability worth strengthening now.

The founder-developed idea grew from applying position sizing, downside control, decomposability, and staged exits to real operating decisions. Risk rarely arrives as one dramatic event. It arrives as a chain: margin compression creates cash pressure; income interruption turns ordinary debt into a trap; a trap removes the ability to exit; and once exit disappears, the future starts making decisions for you.

The goal is not to know what the future will do. It is to avoid a structure in which one plausible future can kill the whole system.

## What it does

Risk Sovereignty is an AI red team and deterministic financial stress test for three distinct U.S. structures:

- **Employer businesses** — common U.S. sectors, employee-size context, revenue, gross margin after COGS, fixed cash commitments, receivables, inventory, debt due within 12 months, and customer concentration.
- **Nonemployers / sole proprietors** — owner-only operating economics with client, platform, working-capital, and debt concentration.
- **Individuals / households** — take-home labor income, essential spending, rent or mortgage, recurring debt payments, credit cards, other consumer debt, cash, accessible reserves, income-producing assets, and primary-income concentration.

Each mode has subject-specific “bad weather.” A business can test revenue loss, margin compression, delayed collections, customer non-payment, accelerated debt, and inventory impairment. A household can test reduced labor income, job interruption, higher essential costs, emergencies, debt-payment increases, accelerated consumer debt, and a haircut to accessible reserves. It can also model rental, dividend, REIT, private-business, bond, or mixed-portfolio income separately from recurring asset carrying costs, then test income decline, income interruption, and asset-value loss as distinct events.

A deterministic engine calculates:

- stressed monthly cash flow;
- immediate liquidity shock;
- economic asset impairment separately from cash loss;
- available buffer and survival runway;
- a six-month hard test;
- the first failing lifeline; and
- the current escalation stage: Signal, Trend, Contagion, or Emergency.

GPT-5.6 then acts as the adversarial analyst. It challenges the scenario, exposes the causal chain, tests whether a claimed exit is actually usable, and proposes exactly three stages: stop bleeding, preserve an exit, and rebuild optionality.

The system answers four questions:

1. What breaks first?
2. How much time remains?
3. What can be isolated or reduced before the failure spreads?
4. What action preserves the right to choose again?

## The core idea: preserve the next move

Risk Sovereignty is not risk avoidance. Once downside is bounded and an exit is credible, the method supports courageous participation and staged scaling.

But it refuses an exitless structure. Every recommendation is evaluated by its trigger, cash cost, reversibility, first partial exit, and the next option it preserves. “Stop loss” does not automatically mean closing everything. The deeper question is whether one failing exposure can be removed without overturning the whole table.

A lucky outcome does not repair a structurally bad decision, and a false alarm does not make a cheap reversible precaution irrational. Decision quality is judged separately from one result.

## How I built it for Build Week

An earlier single-file prototype established the visual direction, deterministic diagnostic structure, and core philosophy. During Build Week, I used Codex to turn that concept into a deployed full-stack application and rebuilt the AI path around the OpenAI Responses API and GPT-5.6.

The architecture separates:

- **User inputs** — facts supplied by the user; the model cannot silently rewrite them.
- **Explicit assumptions** — every stress parameter remains visible and editable.
- **Deterministic calculations** — JavaScript owns cash flow, shocks, runway, stage, and evidence IDs.
- **AI judgment** — GPT-5.6 interprets, challenges, and designs staged actions.
- **Semantic audit** — a post-generation checker rejects invented evidence, reordered action phases, or a missing sovereignty gate.

### The GPT-5.6 workflow

1. The first GPT-5.6 turn is forced to call `calculate_stress_test` with the submitted case.
2. The server normalizes the case, preserves the user's facts, and runs the authoritative engine.
3. A second GPT-5.6 turn receives the verified output and must return a strict JSON Schema report.
4. The app audits action order, sovereignty fields, and evidence references before displaying the report.
5. The interface exposes the model name, methodology version, workflow, calculation trace, and OpenAI response IDs.

This is not a chat wrapper. The model cannot bypass the calculation tool, and a fluent answer that fails the method audit is rejected.

The API key stays server-side. The public demo uses request-size checks, no-store responses, a 75-second upstream timeout, and a two-reports-per-visitor-per-day limit to protect the entrant's small prepaid balance while still letting judges test the real workflow.

## U.S. localization

I rebuilt the presets and vocabulary so U.S. judges do not need to translate a Chinese small-business accounting context.

The interface now uses USD thousands, U.S. Census regions, Census-style nonemployer terminology, and common U.S. employer sectors. Employee bands are context only—not legal SBA classifications—and no hidden industry, size, or regional coefficient changes the user's numbers.

Household scenarios reflect categories repeatedly measured by the Federal Reserve and New York Fed: job and income instability, housing costs, credit cards, mortgages, auto and student debt, major expenses, and commonly held financial or income-producing assets. IRS rental-property guidance informed the visible separation between rental income and carrying expenses. Public data selects understandable fields and starter scenarios; user-supplied facts remain authoritative.

## Challenges

The hardest challenge was preserving one philosophy without forcing three subjects into one false financial model. A household does not have gross margin or accounts receivable. A sole proprietor is not automatically an employer. An inventory write-down is economic damage but not necessarily an immediate cash withdrawal.

The solution was a shared sovereignty method over two deterministic engines: an operating-liquidity engine for businesses and nonemployers, and a household cash-flow engine for individuals and families. The household engine also separates labor income, asset income, carrying costs, liquid reserves, and noncash asset-value loss. Both engines produce the same high-level question—what fails first?—while keeping their accounting meanings separate.

Another challenge was making AI structurally necessary but not numerically authoritative. GPT-5.6 is valuable for messy context, adversarial causal reasoning, exit-reality testing, and reversible action design. It is not allowed to invent the cash result.

## What I learned

AI is strongest in high-stakes decision support when it has visible boundaries. The deterministic engine calculates; the model interprets, challenges, and explains. That combination is more flexible than a spreadsheet and more auditable than an unconstrained chatbot.

I also learned that resilience is not “being safe.” It is the ability to enter meaningful games because no single affordable loss can erase the right to continue.

## What's next

Next steps include validating starter scenarios with U.S. small-business owners, independent workers, households, CPAs, and financial counselors; adding saved scenario comparisons; and expanding the evidence layer without hiding coefficients behind opaque benchmarks.

Risk Sovereignty does not promise to understand the whole future. It helps the user avoid being erased when the future cannot be understood.

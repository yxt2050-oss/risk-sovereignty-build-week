## Inspiration

Most financial software asks how to grow faster, optimize a forecast, or maximize a return. Risk Sovereignty starts with a different question:

**If the world stops cooperating, what breaks first?**

The product does not claim to predict the future. It lets the user construct a visible bad future, identifies the first point where the structure loses its ability to choose, and helps reinforce that weak point before it becomes a trap.

The core idea comes from applying position sizing, downside control, decomposability, and staged exits to operating life. Risk often arrives as a chain: margin compression creates cash pressure; delayed income turns ordinary debt into a trap; a trap removes the ability to exit; and once the exit disappears, the future starts making decisions for you.

The objective is not to know exactly what will happen. It is to avoid a structure in which one plausible future can kill the whole system.

## What it does

Risk Sovereignty is a deterministic financial stress test plus a GPT-5.6 red team for three distinct U.S. structures:

- **Employer businesses:** revenue, gross margin after COGS, fixed cash commitments, receivables, inventory, near-term debt, and customer concentration.
- **Nonemployers / sole proprietors:** owner-only operating economics, platform or client concentration, working capital, and debt.
- **Individuals / households:** take-home labor income, essential spending, housing, recurring debt, credit cards, consumer debt, cash, accessible reserves, asset income, asset carrying costs, and primary-income concentration.

Each structure has its own bad-weather controls. A business can test revenue loss, margin compression, cost increases, delayed collections, customer non-payment, called debt, and inventory impairment. A household can test reduced labor income, job interruption, higher essential costs, emergency expenses, higher debt payments, accelerated consumer debt, reduced asset income, income interruption, reserve haircuts, and asset-value loss.

The deterministic engine calculates:

- stressed monthly cash flow;
- immediate liquidity shock;
- economic asset impairment separately from cash loss;
- available buffer and survival runway;
- a six-month hard test;
- the first failing lifeline; and
- the current stage: Signal, Trend, Contagion, or Emergency.

The stage changes immediately as the user drags the controls. In the recorded manufacturing example, the same balance sheet moves from Signal with 36.0+ months of runway, to Trend with 9.3 months, to Emergency with zero runway. The first failing lifeline changes from Concentration to Collection to Cash.

### Historical Calibration

Many users do not know what stress percentage to enter. The History Calibration module turns their own recent months into a defensible starting range.

The user can enter any two or more months; gaps are allowed. The engine uses the actual time distance, extracts adverse movement in sales or take-home income, gross margin, fixed costs or essentials, and receivable days, and amplifies it with a visible scenario choice:

- Guarded: observed deterioration × 1.25
- Pessimistic: observed deterioration × 1.50
- Extreme break: observed deterioration × 2.00

Profile-specific sensitivity and floors prevent every industry and household from receiving the same generic interval. Public association and official series help challenge direction and scale, but they never overwrite the user's facts. The module is a transparent stress anchor, not a forecast.

### GPT-5.6 AI red team

After the deterministic engine establishes numerical truth, the user can add a simple real-world question, such as:

> Revenue is falling and our largest customer pays late. What should I unwind first to survive without trapping the business?

GPT-5.6 then challenges the assumptions, explains the causal chain, tests whether the claimed exit is actually usable, and produces exactly three stages:

1. stop bleeding;
2. preserve a partial exit; and
3. rebuild optionality.

The live recorded result does not recommend closing the entire business. It freezes new customer-specific exposure first, negotiates debt and releases only surplus inventory in tranches, then rebuilds cash reserves, deposit requirements, billing milestones, and customer-exposure caps.

## The core idea: preserve the next move

Risk Sovereignty is not risk avoidance. Once downside is bounded and an exit is credible, the method supports courageous participation and staged scaling.

But it refuses an exitless structure. Every recommendation must state its trigger, reversibility, partial exit, and the next option it preserves. “Stop loss” does not automatically mean shutting everything down. The deeper question is whether the failing exposure can be removed without overturning the whole table.

A lucky outcome does not repair a structurally bad decision, and a false alarm does not make a cheap reversible precaution irrational. Decision quality is judged separately from one result.

## How I built it for Build Week

An earlier single-file prototype established the visual direction, deterministic diagnostic structure, and founder-developed philosophy. During Build Week, I used Codex to turn that concept into a deployed full-stack application and rebuilt the AI path around the OpenAI Responses API and GPT-5.6.

The architecture separates:

- **User facts:** supplied by the user; the model cannot silently rewrite them.
- **Visible assumptions:** every stress parameter remains editable.
- **Historical calibration:** sparse monthly data, explicit scenario multipliers, and disclosed profile floors.
- **Deterministic calculations:** the application owns cash flow, liquidity shock, impairment, runway, stage, and evidence IDs.
- **AI judgment:** GPT-5.6 interprets, challenges, and designs staged actions.
- **Semantic audit:** a local checker rejects invented evidence, reordered phases, or a missing sovereignty gate.

### The GPT-5.6 workflow

1. The first GPT-5.6 turn is forced to call `calculate_stress_test` with the submitted case.
2. The server normalizes the case, preserves the user's facts, and runs the authoritative deterministic engine.
3. A second GPT-5.6 turn receives the verified output and must return a strict JSON Schema report.
4. The app audits action order, sovereignty fields, and evidence references before displaying the result.
5. The interface exposes the model name, methodology version, workflow, calculation trace, and both OpenAI response IDs.

This is not a chat wrapper. The model cannot bypass the calculation tool, and a fluent answer that fails the method audit is rejected.

The API key stays server-side. The public demo uses request-size checks, no-store responses, a 75-second upstream timeout, and a two-reports-per-visitor-per-day limit so judges can test the real workflow without exhausting a small prepaid account.

## U.S. localization and evidence

The interface uses USD thousands, U.S. Census regions, Census-style nonemployer terminology, common U.S. employer sectors, and household categories familiar to U.S. users. Employer size and region are context, not hidden legal or risk classifications.

The evidence library uses public postmortems to show reusable structural patterns. U.S. business cases include Silicon Valley Bank, Washington Mutual, and Eastman Kodak; Carillion adds a European cash-conversion example. Household and personal cases address income cliffs, leverage, housing, and asset concentration. Cases never change the calculation. Each one separates what failed, why the exit vanished, and which lesson survives.

The English interface is designed for judges and U.S. users. A fully localized Chinese interface preserves the same method and uses translated or transliterated names with original names where helpful.

## Challenges

The hardest challenge was preserving one philosophy without forcing three subjects into one false accounting model. A household does not have gross margin or accounts receivable. A sole proprietor is not automatically an employer. An inventory write-down or asset-price decline is economic damage but not necessarily an immediate cash withdrawal.

The solution was separate deterministic structures under one sovereignty method. Labor income, asset income, carrying costs, liquid reserves, and noncash repricing remain distinct. All structures still answer the same high-level question: **what fails first?**

Another challenge was making AI structurally necessary but not numerically authoritative. GPT-5.6 is valuable for messy context, adversarial reasoning, exit-reality testing, and reversible action design. It is not allowed to invent the cash result.

## What I learned

AI is strongest in high-stakes decision support when it has visible boundaries. The deterministic engine calculates; the model interprets, challenges, and explains. That combination is more flexible than a spreadsheet and more auditable than an unconstrained chatbot.

Resilience is not merely “being safe.” It is the ability to enter meaningful games because no single affordable loss can erase the right to continue.

## What's next

Next steps include validating profile floors and starter scenarios with U.S. small-business owners, independent workers, households, CPAs, and financial counselors; adding saved scenario comparisons; and expanding the evidence layer while keeping every coefficient visible.

Risk Sovereignty does not promise to understand the whole future. It helps the user avoid being erased when the future cannot be understood.

# Judge Guide — Risk Sovereignty

## The 90-second path

1. Start at the runway diagnosis. The loaded manufacturing case fails immediately because simultaneous collection and debt shocks consume more cash than the company holds; inventory impairment remains visible as economic damage without being misreported as an instant cash withdrawal.
2. Move any **Bad weather** slider. The runway, five lifelines, six-month test, and first failure point update locally and deterministically.
3. Switch between **Employer business**, **Independent / sole proprietor**, and **Individual / household**. Presets are editable examples, never hidden benchmarks.
4. In household mode, inspect income interruption, essential-cost inflation, rent or mortgage, debt service, medical or repair emergencies, and accessible savings. Notice that household lifelines and formulas change instead of reusing business gross margin.
5. Open **Staged survival guide**. The product does not jump from “fine” to “shut down”; it removes risk in reversible pieces.
6. Add one sentence of real-world context and run **GPT-5.6 AI red team**.
7. Inspect the **Sovereignty gate**. The app does not assume an exit exists: it labels the exit verified, conditional, or absent, separates calculated damage from personal tolerable loss, and states a re-entry condition.
8. Inspect exactly three intervention phases, critical assumptions, preserved upside, and evidence IDs.
9. End at **Auditable boundary** and verify the separation between input, assumption, calculation, and AI judgment.

## What GPT-5.6 does

The server forces GPT-5.6 to call `calculate_stress_test`. The model does not own the financial results. The submitted case is normalized, calculated locally, and returned to the reasoning chain as tool output. A second GPT-5.6 pass must produce a strict JSON Schema report. The response then passes a deterministic method audit that checks the sovereignty gate, action order, and every evidence reference before it reaches the UI.

Every recommended action includes:

- a trigger;
- a partial exit rather than an all-or-nothing move;
- a reversibility level;
- the future option it preserves; and
- evidence IDs tied to the calculation trace or explicit assumptions.

The method is not risk avoidance. Once downside is bounded and the exit is credible, the final phase must preserve a small route back into the upside. It also refuses outcome bias: a lucky result cannot retroactively make an all-in exposure a good decision.

## Why this matters

Businesses, independent workers, and households rarely lose optionality because they lack another optimistic forecast. They lose it when ordinary risks become contagious and an irreversible decision arrives before they understand which constraint is actually binding.

Risk Sovereignty changes the objective from **maximize the forecast** to **preserve the next move**, then participate from a position that can survive being wrong. The full operational logic is documented in the [Risk Sovereignty Method](METHODOLOGY.md).

## Trust boundary

| Layer | Owner | Rule |
| --- | --- | --- |
| Subject facts | User | AI cannot silently rewrite them |
| Stress assumptions | User | Visible and editable |
| Financial outputs | Deterministic engine | Formula-based, testable, and traceable |
| Interpretation | GPT-5.6 | Tests exit reality, challenges assumptions, and designs staged action |
| Method audit | Local validator | Rejects invalid evidence and broken action order |

The app is a cash-flow decision-support screen, not a GAAP statement or accounting, tax, legal, lending, credit, bankruptcy, benefits, or investment advice.

## Build Week extension

The pre-Build Week concept existed as a single-file visual/calculation prototype. The evaluated Build Week work is the deployable full-stack product: OpenAI Responses API orchestration, forced function calling, strict structured outputs, a bilingual interface, server-only secret handling, auditable evidence links, tests, and production packaging.

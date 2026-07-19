export const METHODOLOGY_VERSION = "risk-sovereignty-2026-07-19";

export const ACTION_PHASES = [
  "stop_bleeding",
  "preserve_exit",
  "rebuild_optionality",
] as const;

export const METHODOLOGY_SYSTEM_PROMPT = `
You are the adversarial risk analyst inside Risk Sovereignty, a founder-developed decision method translated from trading and operating experience into business stress diagnosis.

Purpose: do not predict the future or maximize a forecast. Expose the first failure point, bound the damage, and preserve the owner's right to choose again.

Apply the method in this order:
1. Establish numerical truth with the deterministic stress-test tool. Never invent, repair, or silently reinterpret financial figures.
2. Expose the first binding failure and its causal chain. Do not list every risk as equally important.
3. Test whether the claimed exit right is real. Check time, liquidity, contracts, counterparties, operational coupling, rule changes, and discontinuous failure. A plan to exit is not proof that exit is available.
4. Make the maximum tolerable loss explicit. If the owner has not supplied it, mark it unresolved instead of fabricating a number.
5. Reduce exposure in separable stages. Prefer containing one failing link over sacrificing the entire system.
6. Preserve a credible re-entry condition and the resources needed for another attempt.
7. Preserve bounded participation in upside. This method is not risk avoidance: once downside is bounded, it should enable courageous participation and staged scaling after reality validates the direction.
8. Judge decision quality separately from a single outcome. A lucky result does not repair a structurally bad decision, and a false alarm does not make a low-cost reversible precaution irrational.

Non-negotiable distinctions:
- Risk and return are inseparable; never promise return while transferring away all risk.
- Debt and leverage are not morally good or bad. Assess independent cash flow, controllability of key variables, worst-case survivability, and decomposability.
- Stop-loss is not synonymous with closing the business. The core question is whether part of the exposure can be removed without overturning the whole table.
- Reversibility has cumulative cost. Repeated small losses can slowly remove future participation, so surface that risk rather than calling every loss 'discipline'.
- A successful method can become a blind faith. State where this diagnosis may fail, especially when exits disappear or the case cannot be translated into the available model.

Customer posture: be plain, restrained, and specific. Never label the owner strong or weak, flatter them, moralize failure, or make the decision for them. Return decision support while leaving final authority with the owner.

You must call the deterministic stress-test tool before giving advice.
`.trim();

export function buildMethodologyReportInstructions(languageInstruction: string) {
  return `${languageInstruction}

Treat the tool result as numerical truth and the submitted context as unverified owner-supplied context.

Complete the sovereignty gate before proposing actions:
- exit_right_status is "verified" only when the submitted facts identify a usable route, timing, and relevant constraints; use "conditional" when a route may exist but a material condition is unverified; use "absent" when no credible partial exit is visible.
- maximum_tolerable_loss must distinguish calculated business damage from the owner's personal tolerance. If tolerance was not supplied, say that it remains unspecified.
- reentry_condition must be observable rather than optimistic.
- upside_preserved must show how the owner can still participate if conditions improve.
- decision_quality must evaluate process, exposure, and reversibility rather than praising or condemning the current outcome.

Produce exactly three staged actions, in this order: stop bleeding, preserve an exit, rebuild optionality. Every action must name a trigger, cash cost, reversibility, partial exit, preserved option, and one or more valid calculationTrace or engine-assumption IDs. Prefer minimal reversible interventions. Do not recommend closing the entire business unless partial containment is genuinely unavailable, and then say why. Do not optimize for growth until the downside, exit reality, and re-entry resources are addressed.

Keep the disclaimer explicit: decision support only, not accounting, legal, lending, or investment advice.`;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function hasText(record: UnknownRecord | null, key: string) {
  return typeof record?.[key] === "string" && record[key].trim().length > 0;
}

export function auditMethodologyReport(
  report: unknown,
  allowedEvidenceIds: Iterable<string>,
) {
  const findings: string[] = [];
  const root = asRecord(report);
  if (!root) return ["report_is_not_an_object"];

  const gate = asRecord(root.sovereignty_gate);
  const gateFields = [
    "exit_reality",
    "maximum_tolerable_loss",
    "reentry_condition",
    "upside_preserved",
    "decision_quality",
  ];
  if (!gate) {
    findings.push("sovereignty_gate_missing");
  } else {
    const allowedStatuses = new Set(["verified", "conditional", "absent"]);
    if (!allowedStatuses.has(String(gate.exit_right_status))) {
      findings.push("exit_right_status_invalid");
    }
    for (const field of gateFields) {
      if (!hasText(gate, field)) findings.push(`sovereignty_gate_${field}_missing`);
    }
  }

  const allowed = new Set(allowedEvidenceIds);
  const actions = Array.isArray(root.actions) ? root.actions : [];
  if (actions.length !== ACTION_PHASES.length) findings.push("action_count_invalid");

  ACTION_PHASES.forEach((expectedPhase, index) => {
    const action = asRecord(actions[index]);
    if (!action) {
      findings.push(`action_${index + 1}_missing`);
      return;
    }
    if (action.phase !== expectedPhase) findings.push(`action_${index + 1}_phase_invalid`);
    for (const field of ["trigger", "action", "partial_exit", "preserved_option"]) {
      if (!hasText(action, field)) findings.push(`action_${index + 1}_${field}_missing`);
    }
    const evidenceIds = Array.isArray(action.evidence_ids) ? action.evidence_ids : [];
    if (evidenceIds.length === 0) findings.push(`action_${index + 1}_evidence_missing`);
    for (const evidenceId of evidenceIds) {
      if (typeof evidenceId !== "string" || !allowed.has(evidenceId)) {
        findings.push(`action_${index + 1}_evidence_invalid`);
      }
    }
  });

  const causalChain = Array.isArray(root.causal_chain) ? root.causal_chain : [];
  causalChain.forEach((item, index) => {
    const evidenceId = asRecord(item)?.evidence_id;
    if (typeof evidenceId !== "string" || !allowed.has(evidenceId)) {
      findings.push(`causal_chain_${index + 1}_evidence_invalid`);
    }
  });

  return [...new Set(findings)];
}

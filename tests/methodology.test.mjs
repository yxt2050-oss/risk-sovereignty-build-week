import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTION_PHASES,
  auditMethodologyReport,
  METHODOLOGY_SYSTEM_PROMPT,
} from "../lib/methodology.ts";

const allowedEvidence = ["monthly_cash_flow", "one_time_shock", "survival_runway"];

function validReport() {
  return {
    sovereignty_gate: {
      exit_right_status: "conditional",
      exit_reality: "Asset sale timing is not yet verified.",
      maximum_tolerable_loss: "Owner tolerance remains unspecified.",
      reentry_condition: "Cash flow turns positive for two reporting periods.",
      upside_preserved: "Keep a small validation budget.",
      decision_quality: "Judge the exposure and process, not the latest outcome.",
    },
    causal_chain: [
      { evidence_id: "monthly_cash_flow" },
      { evidence_id: "one_time_shock" },
    ],
    actions: ACTION_PHASES.map((phase, index) => ({
      phase,
      trigger: `Observable trigger ${index + 1}`,
      action: `Staged action ${index + 1}`,
      partial_exit: "Remove one separable exposure.",
      preserved_option: "Preserve resources for re-entry.",
      evidence_ids: [allowedEvidence[index]],
    })),
  };
}

test("methodology encodes participation, exit reality, and outcome independence", () => {
  assert.match(METHODOLOGY_SYSTEM_PROMPT, /not risk avoidance/i);
  assert.match(METHODOLOGY_SYSTEM_PROMPT, /exit right is real/i);
  assert.match(METHODOLOGY_SYSTEM_PROMPT, /single outcome/i);
  assert.match(METHODOLOGY_SYSTEM_PROMPT, /Repeated small losses/i);
});

test("a staged report passes the deterministic methodology audit", () => {
  assert.deepEqual(auditMethodologyReport(validReport(), allowedEvidence), []);
});

test("the audit rejects reordered phases, imaginary evidence, and a missing gate", () => {
  const report = validReport();
  report.sovereignty_gate = undefined;
  report.actions[0].phase = "rebuild_optionality";
  report.actions[1].evidence_ids = ["invented_fact"];

  const findings = auditMethodologyReport(report, allowedEvidence);
  assert.ok(findings.includes("sovereignty_gate_missing"));
  assert.ok(findings.includes("action_1_phase_invalid"));
  assert.ok(findings.includes("action_2_evidence_invalid"));
});

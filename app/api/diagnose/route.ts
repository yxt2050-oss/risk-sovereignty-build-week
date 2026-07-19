import {
  calculateStressTest,
  normalizeRiskCase,
  RISK_CASE_JSON_SCHEMA,
  type RiskCase,
} from "@/lib/engine";
import {
  auditMethodologyReport,
  buildMethodologyReportInstructions,
  METHODOLOGY_SYSTEM_PROMPT,
  METHODOLOGY_VERSION,
} from "@/lib/methodology";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_REQUEST_CHARS = 16_000;
// Protect the entrant's small prepaid balance while still allowing a judge to
// run the demo twice (for example, once in each language).
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT = 2;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    verdict: {
      type: "object",
      additionalProperties: false,
      properties: {
        stage: {
          type: "string",
          enum: ["signal", "trend", "contagion", "emergency"],
        },
        first_failure: { type: "string" },
        runway: { type: "string" },
        why: { type: "string" },
      },
      required: ["stage", "first_failure", "runway", "why"],
    },
    sovereignty_gate: {
      type: "object",
      additionalProperties: false,
      properties: {
        exit_right_status: {
          type: "string",
          enum: ["verified", "conditional", "absent"],
        },
        exit_reality: { type: "string" },
        maximum_tolerable_loss: { type: "string" },
        reentry_condition: { type: "string" },
        upside_preserved: { type: "string" },
        decision_quality: { type: "string" },
      },
      required: [
        "exit_right_status",
        "exit_reality",
        "maximum_tolerable_loss",
        "reentry_condition",
        "upside_preserved",
        "decision_quality",
      ],
    },
    causal_chain: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          order: { type: "number" },
          event: { type: "string" },
          consequence: { type: "string" },
          evidence_id: { type: "string" },
        },
        required: ["order", "event", "consequence", "evidence_id"],
      },
    },
    actions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          phase: {
            type: "string",
            enum: ["stop_bleeding", "preserve_exit", "rebuild_optionality"],
          },
          trigger: { type: "string" },
          action: { type: "string" },
          cash_cost: { type: "string" },
          reversibility: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          partial_exit: { type: "string" },
          preserved_option: { type: "string" },
          evidence_ids: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "phase",
          "trigger",
          "action",
          "cash_cost",
          "reversibility",
          "partial_exit",
          "preserved_option",
          "evidence_ids",
        ],
      },
    },
    critical_assumptions: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          assumption: { type: "string" },
          failure_if_wrong: { type: "string" },
          how_to_verify: { type: "string" },
        },
        required: ["assumption", "failure_if_wrong", "how_to_verify"],
      },
    },
    owner_question: { type: "string" },
    disclaimer: { type: "string" },
  },
  required: [
    "summary",
    "verdict",
    "sovereignty_gate",
    "causal_chain",
    "actions",
    "critical_assumptions",
    "owner_question",
    "disclaimer",
  ],
} as const;

type OpenAIOutputItem = {
  type?: string;
  name?: string;
  arguments?: string;
  call_id?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type OpenAIResponse = {
  id?: string;
  output?: OpenAIOutputItem[];
  error?: { message?: string };
};

function extractOutputText(response: OpenAIResponse) {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return "";
}

async function createResponse(apiKey: string, body: Record<string, unknown>) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(75_000),
  });

  const payload = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI API error (${response.status})`);
  }
  return payload;
}

function checkRateLimit(request: Request) {
  const now = Date.now();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = request.headers.get("cf-connecting-ip") || forwarded || "anonymous";
  const current = rateBuckets.get(client);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(client, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }

  if (current.count >= RATE_LIMIT) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;
  if (rateBuckets.size > 1_000) {
    for (const [key, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(key);
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error: "OPENAI_API_KEY is not configured on the server.",
          code: "OPENAI_API_KEY_MISSING",
        },
        { status: 503 },
      );
    }

    const retryAfter = checkRateLimit(request);
    if (retryAfter) {
      return Response.json(
        {
          error: "Demo rate limit reached. Please try again shortly.",
          code: "DEMO_RATE_LIMIT",
        },
        {
          status: 429,
          headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfter) },
        },
      );
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_REQUEST_CHARS) {
      return Response.json(
        { error: "Request is too large.", code: "REQUEST_TOO_LARGE" },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_CHARS) {
      return Response.json(
        { error: "Request is too large.", code: "REQUEST_TOO_LARGE" },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    const submitted = JSON.parse(rawBody) as RiskCase;
    const riskCase = normalizeRiskCase(submitted);
    const languageInstruction =
      riskCase.locale === "zh"
        ? "Write every human-facing string in concise Simplified Chinese."
        : "Write every human-facing string in concise English.";

    const tool = {
      type: "function",
      name: "calculate_stress_test",
      description:
        "Run the authoritative deterministic cash-flow stress engine for a U.S. employer business, nonemployer/sole proprietor, or household. Use the supplied facts and scenario values exactly; never calculate financial outputs yourself.",
      parameters: RISK_CASE_JSON_SCHEMA,
      strict: true,
    };

    const input: Array<Record<string, unknown>> = [
      {
        role: "system",
        content: METHODOLOGY_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `${languageInstruction}\nAnalyze this subject and scenario. Respect subjectType: do not use business language for a household or employer language for a nonemployer. Context may be incomplete; surface uncertainty instead of silently filling gaps.\n${JSON.stringify(riskCase)}`,
      },
    ];

    const toolResponse = await createResponse(apiKey, {
      model: "gpt-5.6",
      // This turn only has to preserve the submitted facts and emit the forced
      // tool call. Low effort keeps the live demo responsive without reducing
      // the depth of the report-writing turn below.
      reasoning: { effort: "low" },
      input,
      tools: [tool],
      tool_choice: { type: "function", name: "calculate_stress_test" },
      parallel_tool_calls: false,
      store: false,
      max_output_tokens: 1600,
    });

    input.push(...((toolResponse.output ?? []) as Array<Record<string, unknown>>));
    const toolCall = (toolResponse.output ?? []).find(
      (item) => item.type === "function_call" && item.name === "calculate_stress_test",
    );

    if (!toolCall?.arguments || !toolCall.call_id) {
      throw new Error("GPT-5.6 did not call the required stress-test tool.");
    }

    const toolArguments = normalizeRiskCase(JSON.parse(toolCall.arguments) as RiskCase);
    const argumentIntegrity =
      JSON.stringify(toolArguments) === JSON.stringify(riskCase);
    const engine = calculateStressTest(riskCase);
    input.push({
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: JSON.stringify({
        riskCase,
        engine,
        argumentIntegrity: argumentIntegrity
          ? "model_arguments_match_submitted_case"
          : "submitted_case_preserved_despite_model_argument_drift",
      }),
    });

    const reportResponse = await createResponse(apiKey, {
      model: "gpt-5.6",
      // The deterministic engine already established numerical truth. Medium
      // reasoning is the best latency/quality trade-off for the public demo;
      // the strict schema and semantic audit still reject shallow answers.
      reasoning: { effort: "medium" },
      instructions: buildMethodologyReportInstructions(languageInstruction),
      input,
      tools: [tool],
      tool_choice: "none",
      text: {
        format: {
          type: "json_schema",
          name: "risk_sovereignty_report",
          strict: true,
          schema: REPORT_SCHEMA,
        },
      },
      store: false,
      max_output_tokens: 3600,
    });

    const reportText = extractOutputText(reportResponse);
    if (!reportText) throw new Error("GPT-5.6 returned no structured report.");
    const report = JSON.parse(reportText) as unknown;
    const allowedEvidenceIds = [
      ...engine.calculationTrace.map(({ id }) => id),
      ...engine.assumptions.map(({ id }) => id),
    ];
    const methodologyFindings = auditMethodologyReport(report, allowedEvidenceIds);
    if (methodologyFindings.length > 0) {
      throw new Error(
        `GPT-5.6 report failed the Risk Sovereignty audit: ${methodologyFindings.join(", ")}`,
      );
    }

    return Response.json(
      {
        engine,
        report,
        audit: {
          model: "gpt-5.6",
          methodology: METHODOLOGY_VERSION,
          workflow: [
            "forced_function_call",
            "deterministic_engine",
            "strict_structured_output",
            "latency_balanced_reasoning",
            "methodology_semantic_audit",
            argumentIntegrity
              ? "argument_integrity_verified"
              : "submitted_input_preserved",
          ],
          toolResponseId: toolResponse.id ?? null,
          reportResponseId: reportResponse.id ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Risk-Sovereignty-Model": "gpt-5.6",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unexpected diagnosis error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

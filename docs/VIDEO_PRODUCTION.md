# Demo video production sheet

Target: **2:35–2:50**, English voiceover, public YouTube upload, 1080p, readable at normal playback speed.

Use the narration in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md). Do not describe the fallback as an AI result. Record the final product segment only after the server secret is configured and the green audit strip shows `gpt-5.6`, `forced_function_call`, `deterministic_engine`, `strict_structured_output`, and two response IDs.

## Shot list

| Time | Picture | Required proof |
| --- | --- | --- |
| 0:00–0:12 | Social card, then hero and runway | Product name and one-sentence problem |
| 0:12–0:35 | Change Manufacturing inputs | User facts remain editable; numbers recalculate immediately |
| 0:35–0:58 | Move payment-delay, debt-call, and customer-loss sliders | Visible assumptions; first failure and runway change deterministically |
| 0:58–1:18 | Scroll through lifelines and calculation trace | Formula IDs and separation of input / assumption / calculation / AI |
| 1:18–1:55 | Add one line of business context and click the GPT-5.6 button | A real network-backed run; no fallback notice |
| 1:55–2:22 | Show causal chain, three actions, assumption checks, and owner question | Evidence IDs on every action |
| 2:22–2:40 | Hold on the audit strip | Model name, forced tool call, deterministic engine, strict output, response IDs |
| 2:40–2:50 | End card | “Survival before maximization. Preserve the next move.” |

## Capture checklist

- Use the English interface and the Manufacturing sample.
- Close unrelated tabs and notifications; never expose an API key or billing page.
- Keep browser zoom at 100% and cursor movement deliberate.
- Show one continuous real GPT-5.6 request, including loading state and returned report.
- If the API fails, stop and recapture; never splice a fallback screen into the claimed AI run.
- Voiceover may be AI-assisted, but it must explicitly explain how Codex and GPT-5.6 were used.
- Upload as a **public** YouTube video and verify playback while signed out.

## Remaining user-only actions

1. Add funds and a hard budget to a dedicated OpenAI API project.
2. Paste `OPENAI_API_KEY` directly into the secure hosting secret field—never into chat, source code, a screenshot, or the video.
3. Authorize the GitHub push if Git Credential Manager asks.
4. Upload the final MP4 to YouTube and paste the public URL into Devpost.
5. Run `/feedback` in the primary Codex build task and paste the Session ID into Devpost.
6. Review Preview, then explicitly approve the final Devpost submission.

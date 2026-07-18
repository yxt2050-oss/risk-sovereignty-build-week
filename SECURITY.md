# Security notes

## Secrets

`OPENAI_API_KEY` is server-only. Never commit it, paste it into a public issue, expose it in client JavaScript, or include it in screen recordings. `.env*` files are ignored; `.env.example` contains names only.

## Public demo controls

The diagnosis endpoint rejects oversized requests, applies a small per-client in-memory demo rate limit, times out upstream calls, disables caching, normalizes all numerical inputs, and preserves the submitted case even if model tool arguments drift.

In-memory rate limiting is intentionally lightweight and can reset across serverless instances. Before enabling a public API-backed demo, use a dedicated OpenAI API project with a low hard budget and usage alerts. Rotate the key after the judging period.

## Reporting

Please avoid submitting real confidential financial data to the public demo. For a security concern, open a GitHub issue containing reproduction steps but no credentials or private business information.

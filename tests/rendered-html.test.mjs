import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Risk Sovereignty experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Risk Sovereignty \| AI Stress Test for Small Businesses<\/title>/i);
  assert.match(html, /RISK SOVEREIGNTY/);
  assert.match(html, /哪一条命先断/);
  assert.match(html, /GPT(?:-|‑|鈥)?5\.6/);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview|react-loading-skeleton/);
});

test("ships semantic controls and the audit boundary", async () => {
  const html = await (await render()).text();
  assert.match(html, /<main[^>]*class="app-shell"/);
  assert.match(html, /type="range"/);
  assert.match(html, /id="ai"/);
  assert.match(html, /id="audit"/);
  assert.match(html, /生成加固报告/);
});

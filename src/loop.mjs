import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export async function search({ query, url }) {
  const started = Date.now();
  const response = await fetch(url, { headers: { "user-agent": "talocode-loop/0.1" } });
  const text = await response.text();
  const lines = text.split("\n").filter((line) => query.split(/\s+/).some((word) => word.length > 3 && line.toLowerCase().includes(word.toLowerCase())));
  return { name: "search", ok: response.ok, ms: Date.now() - started, url, status: response.status, matches: lines.slice(0, 8), text };
}

export function verify({ text, claim }) {
  const found = text.includes(claim);
  return { name: "verify", ok: found, ms: 0, claim, found, error: found ? null : "claim not present in searched source" };
}

export function trace(spans) {
  return { name: "trace", ok: spans.every((span) => span.ok), id: `loop_${randomUUID()}`, spans: spans.map(({ text, ...span }) => span) };
}

export async function remember({ traceId, query, claim, ok }) {
  const path = join(homedir(), ".talocode", "loop-memory.json");
  await mkdir(join(homedir(), ".talocode"), { recursive: true });
  let items = [];
  try { items = JSON.parse(await readFile(path, "utf8")); } catch { items = []; }
  const memory = { id: randomUUID(), traceId, query, claim, ok, at: new Date().toISOString() };
  items.push(memory);
  await writeFile(path, JSON.stringify(items.slice(-50), null, 2));
  return { name: "remember", ok: true, ms: 1, memory };
}

export async function runLoop({ query, url, claim }) {
  const searched = await search({ query, url });
  const verified = verify({ text: searched.text, claim });
  const traced = trace([searched, verified]);
  const remembered = await remember({ traceId: traced.id, query, claim, ok: traced.ok });
  return { ok: traced.ok, product: "@talocode/loop", version: "0.1.0", query, url, traceId: traced.id, steps: [searched, verified, traced, remembered].map(({ text, ...step }) => step) };
}

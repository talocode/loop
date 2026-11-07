import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const VERSION = "0.3.0";

export function excerptFor(text, claim, max = 180) {
  const line = String(text || "").split("\n").find((row) => row.includes(claim));
  if (!line) return null;
  const clean = line.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const at = Math.max(0, clean.indexOf(claim) - 40);
  const slice = clean.slice(at, at + max).trim();
  return `${at > 0 ? "…" : ""}${slice}${at + max < clean.length ? "…" : ""}`;
}

export function normalizeClaims(claims) {
  const list = [...new Set((Array.isArray(claims) ? claims : []).map((claim) => String(claim).trim()).filter(Boolean))];
  if (!list.length) throw new Error("at least one claim is required");
  if (list.some((claim) => claim.length > 500)) throw new Error("claim is too long");
  return list.slice(0, 8);
}

export function judgeClaims(text, claims) {
  return claims.map((claim) => ({
    claim,
    found: String(text || "").includes(claim),
    excerpt: excerptFor(text, claim),
  }));
}

export function summarizeAudit({ loaded, results }) {
  const total = results.length;
  const foundCount = results.filter((row) => row.found).length;
  if (!loaded) return "The page did not load. No credit.";
  if (total === 1) {
    return foundCount
      ? "The page loaded and the claim was in it. No credit on this machine."
      : "The page loaded. The claim was not in it. No credit on this machine.";
  }
  if (foundCount === total) return `The page loaded. All ${total} claims were in it. No credit on this machine.`;
  if (foundCount === 0) return `The page loaded. None of the ${total} claims were in it. No credit on this machine.`;
  return `The page loaded. ${foundCount} of ${total} claims were in it. No credit on this machine.`;
}

export async function search({ query, url }) {
  const started = Date.now();
  const response = await fetch(url, { headers: { "user-agent": "talocode-loop/0.3" } });
  const text = await response.text();
  const lines = text.split("\n").filter((line) => query.split(/\s+/).some((word) => word.length > 3 && line.toLowerCase().includes(word.toLowerCase())));
  return { name: "search", ok: response.ok, ms: Date.now() - started, url, status: response.status, matches: lines.slice(0, 8), text };
}

export function verify({ text, claim }) {
  const found = text.includes(claim);
  const excerpt = found ? excerptFor(text, claim) : null;
  return { name: "verify", ok: found, ms: 0, claim, found, excerpt, error: found ? null : "claim not present in searched source" };
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
  const summary = !searched.ok
    ? "The page did not load. No credit."
    : verified.found
      ? "The page loaded and the claim was in it. No credit on this machine."
      : "The page loaded. The claim was not in it. No credit on this machine.";
  return {
    ok: traced.ok,
    product: "@talocode/loop",
    version: VERSION,
    query,
    url,
    traceId: traced.id,
    excerpt: verified.excerpt,
    summary,
    credits: 0,
    steps: [searched, verified, traced, remembered].map(({ text, ...step }) => step),
  };
}

export async function runAudit({ query, url, claims }) {
  const list = normalizeClaims(claims);
  const searched = await search({ query, url });
  const results = judgeClaims(searched.ok ? searched.text : "", list).map((row) => (
    searched.ok ? row : { claim: row.claim, found: false, excerpt: null }
  ));
  const foundCount = results.filter((row) => row.found).length;
  const verified = { name: "verify", ok: foundCount === results.length, checked: results.length, found: foundCount, claims: results };
  const traced = trace([searched, verified]);
  const remembered = await remember({ traceId: traced.id, query, claim: list.join(" | "), ok: traced.ok });
  return {
    ok: traced.ok,
    product: "@talocode/loop",
    version: VERSION,
    query,
    url,
    traceId: traced.id,
    loaded: searched.ok ? 1 : 0,
    credits: 0,
    checked: results.length,
    found: foundCount,
    summary: summarizeAudit({ loaded: searched.ok ? 1 : 0, results }),
    claims: results,
    steps: [searched, verified, traced, remembered].map(({ text, ...step }) => step),
  };
}

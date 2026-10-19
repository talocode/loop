const MAX_BYTES = 200_000;

export async function fetchSource(url, timeoutMs = 8000) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "talocode-loop/0.1", accept: "text/plain,text/markdown,text/html,application/json" },
      redirect: "follow",
    });
    const raw = await response.text();
    const text = raw.slice(0, MAX_BYTES);
    return {
      url,
      ok: response.ok,
      status: response.status,
      bytes: raw.length,
      truncated: raw.length > text.length,
      ms: Date.now() - started,
      error: response.ok ? null : `HTTP ${response.status}`,
      text,
    };
  } catch (err) {
    return {
      url,
      ok: false,
      status: 0,
      bytes: 0,
      truncated: false,
      ms: Date.now() - started,
      error: err.name === "AbortError" ? "timeout" : (err.message || "fetch failed"),
      text: "",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function briefFromSources({ question, sources }) {
  const rows = sources.map(({ text, ...row }) => row);
  const failed = rows.filter((row) => !row.ok);
  const recommendation = rows.length === 0 || failed.length > 0 ? "do_not_ship" : "review";
  return {
    ok: failed.length === 0 && rows.length > 0,
    product: "@talocode/loop",
    version: "0.1.1",
    question,
    recommendation,
    reason: failed.length
      ? "At least one named source failed. A missing source is not treated as agreement."
      : rows.length
        ? "Every named source responded. This is a review queue, not a decision to ship."
        : "No sources were named.",
    sources: rows,
  };
}

export async function runBrief({ question, urls, timeoutMs }) {
  const list = [...new Set((urls || []).map((url) => String(url).trim()).filter(Boolean))];
  const sources = [];
  for (const url of list) sources.push(await fetchSource(url, timeoutMs));
  return briefFromSources({ question, sources });
}

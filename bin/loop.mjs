#!/usr/bin/env node
import { runLoop } from "../src/loop.mjs";
import { runBrief } from "../src/brief.mjs";
import { startMcp } from "../src/mcp.mjs";
import { startServer } from "../src/server.mjs";

const [cmd, ...rest] = process.argv.slice(2);
const flags = {};
const urls = [];
for (const arg of rest) {
  if (!arg.startsWith("--")) continue;
  const [k, v = "true"] = arg.slice(2).split("=");
  if (k === "url" || k === "urls") {
    for (const url of String(v).split(",")) urls.push(url.trim());
  } else {
    flags[k] = v;
  }
}

if (cmd === "mcp") startMcp();
else if (cmd === "serve") startServer(Number(flags.port || 8787));
else if (cmd === "brief") {
  const receipt = await runBrief({
    question: flags.question || flags.query || "",
    urls,
    timeoutMs: Number(flags.timeout || 8000),
  });
  process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
  process.exit(receipt.ok ? 0 : 1);
} else if (cmd === "run" || !cmd) {
  const receipt = await runLoop({
    query: flags.query || "Talocode official mint and credit claim",
    url: urls[0] || flags.url || "https://talocode.site/llms.txt",
    claim: flags.claim || "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory",
  });
  process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
  process.exit(receipt.ok ? 0 : 1);
} else {
  process.stderr.write("Usage: talocode-loop run|brief|mcp|serve\n");
  process.exit(2);
}

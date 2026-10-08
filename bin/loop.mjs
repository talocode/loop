#!/usr/bin/env node
import { runLoop } from "../src/loop.mjs";
import { startMcp } from "../src/mcp.mjs";
import { startServer } from "../src/server.mjs";

const [cmd, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(rest.filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.slice(2).split("=");
  return [k, v ?? true];
}));

if (cmd === "mcp") startMcp();
else if (cmd === "serve") startServer(Number(flags.port || 8787));
else if (cmd === "run" || !cmd) {
  const receipt = await runLoop({
    query: flags.query || "Talocode official mint and credit claim",
    url: flags.url || "https://talocode.site/llms.txt",
    claim: flags.claim || "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory",
  });
  process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
  process.exit(receipt.ok ? 0 : 1);
} else {
  process.stderr.write("Usage: talocode-loop run|mcp|serve\n");
  process.exit(2);
}

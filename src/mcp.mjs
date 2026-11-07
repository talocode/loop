import { runLoop } from "./loop.mjs";
import { runBrief } from "./brief.mjs";

const tools = [
  { name: "loop_run", description: "Search one public page, verify a claim, and return a receipt.", inputSchema: { type: "object", properties: { query: { type: "string" }, url: { type: "string" }, claim: { type: "string" } }, required: ["query", "url", "claim"] } },
  { name: "loop_brief", description: "Fetch every named source. A failed source stays in the receipt and the recommendation is do_not_ship.", inputSchema: { type: "object", properties: { question: { type: "string" }, urls: { type: "array", items: { type: "string" } } }, required: ["urls"] } },
];

export function startMcp() {
  const send = (message) => process.stdout.write(JSON.stringify(message) + "\n");
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.method === "initialize") send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "talocode-loop", version: "0.2.0" } } });
      else if (msg.method === "tools/list") send({ jsonrpc: "2.0", id: msg.id, result: { tools } });
      else if (msg.method === "tools/call") {
        const args = msg.params?.arguments || {};
        const receipt = msg.params?.name === "loop_brief"
          ? await runBrief({ question: args.question || "", urls: args.urls || [] })
          : await runLoop(args);
        send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(receipt) }], isError: !receipt.ok } });
      } else if (msg.id) send({ jsonrpc: "2.0", id: msg.id, result: {} });
    }
  });
}

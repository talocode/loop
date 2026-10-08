import { runLoop } from "./loop.mjs";

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
      if (msg.method === "initialize") send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "talocode-loop", version: "0.1.0" } } });
      else if (msg.method === "tools/list") send({ jsonrpc: "2.0", id: msg.id, result: { tools: [{ name: "loop_run", description: "Search, verify, trace, and remember one Talocode loop.", inputSchema: { type: "object", properties: { query: { type: "string" }, url: { type: "string" }, claim: { type: "string" } }, required: ["query", "url", "claim"] } }] } });
      else if (msg.method === "tools/call") {
        const receipt = await runLoop(msg.params.arguments);
        send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(receipt) }], isError: !receipt.ok } });
      } else if (msg.id) send({ jsonrpc: "2.0", id: msg.id, result: {} });
    }
  });
}

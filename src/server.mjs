import { createServer } from "node:http";
import { runLoop } from "./loop.mjs";

export function startServer(port = 8787) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (req.method === "GET" && url.pathname === "/v1/loop/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, product: "@talocode/loop", version: "0.1.0" }));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/loop/run") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      const receipt = await runLoop(body);
      res.writeHead(receipt.ok ? 200 : 422, { "content-type": "application/json" });
      res.end(JSON.stringify(receipt));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "not_found", message: `Unknown endpoint: ${req.method} ${url.pathname}` } }));
  });
  server.listen(port);
  return server;
}

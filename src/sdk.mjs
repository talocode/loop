import { runLoop, runAudit } from "./loop.mjs";
import { runBrief } from "./brief.mjs";

export class TalocodeLoop {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.TALOCODE_LOOP_URL || "";
    this.apiKey = options.apiKey || process.env.TALOCODE_API_KEY || "";
  }
  async request(path, input) {
    if (!this.baseUrl) return null;
    const response = await fetch(new URL(path, this.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
      body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 422) {
      const error = new Error(body.message || body.error || `loop ${response.status}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }
  async run(input) {
    return (await this.request("/v1/loop/run", input)) || runLoop(input);
  }
  async brief(input) {
    const urls = input.urls || (input.url ? [input.url] : []);
    return (await this.request("/v1/loop/brief", { question: input.question || input.query || "", urls })) || runBrief({ ...input, urls });
  }
  async audit(input) {
    const claims = input.claims || (input.claim ? [input.claim] : []);
    return (await this.request("/v1/loop/audit", { query: input.query, url: input.url, claims })) || runAudit({ ...input, claims });
  }
}

export { runLoop, runBrief, runAudit };

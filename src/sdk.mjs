import { runLoop } from "./loop.mjs";

export class TalocodeLoop {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.TALOCODE_LOOP_URL || "";
    this.apiKey = options.apiKey || process.env.TALOCODE_API_KEY || "";
  }
  async run(input) {
    if (!this.baseUrl) return runLoop(input);
    const response = await fetch(new URL("/v1/loop/run", this.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`loop ${response.status}`);
    return response.json();
  }
}

export { runLoop };

# Talocode Loop

Search a public page, verify a claim against that page, and keep the receipt.

The same call is a CLI, an SDK, a local MCP server, and a hosted API. A failing verify stays a failed receipt. It does not pretend the run succeeded.

A hosted credit moves only when a source loads. A timeout or an HTTP error costs nothing. The local CLI does not use credits.

## Install

```bash
npm install -g @talocode/loop
```

The command is `talocode-loop`. From this repo, `node bin/loop.mjs` does the same thing.

## CLI

```bash
talocode-loop run \
  --query="Talocode official mint" \
  --url=https://talocode.site/llms.txt \
  --claim=6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory
```

Research brief. Fetch every source you name. `recommendation` is `do_not_ship` when any source fails, and `review` when every source responds. Page text is not printed. This is not a decision to ship.

```bash
talocode-loop brief \
  --question="Is this source enough?" \
  --url=https://talocode.site/llms.txt
```

Local server, no credits:

```bash
talocode-loop serve --port=8787
```

`GET /v1/loop/health` and `POST /v1/loop/run`.

## SDK

```js
import { TalocodeLoop } from "@talocode/loop";

const loop = new TalocodeLoop();
await loop.run({
  query: "Talocode official mint",
  url: "https://talocode.site/llms.txt",
  claim: "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory",
});

await loop.brief({
  question: "Is this source enough?",
  urls: ["https://talocode.site/llms.txt"],
});
```

Leave the base URL empty to run on this machine. Set it to spend cloud credits:

```js
const hosted = new TalocodeLoop({
  baseUrl: process.env.TALOCODE_LOOP_URL || "https://api.talocode.site",
  apiKey: process.env.TALOCODE_API_KEY,
});
```

## MCP

```bash
talocode-loop mcp
```

Tools: `loop_run` and `loop_brief`.

The hosted MCP is `https://api.talocode.site/mcp` with the same API key. Hosted tools:

| Tool | Credits |
|---|---|
| `loop_health` | free |
| `loop_pricing` | free |
| `loop_capabilities` | free |
| `loop_run` | 1 if the page loads |
| `loop_brief` | 1 per page that loads, maximum 5 |

## Hosted API

Base URL: `https://api.talocode.site`

| Method | Path | Auth | Credits |
|---|---|---|---|
| GET | `/v1/loop/health` | no | 0 |
| GET | `/v1/loop/pricing` | no | 0 |
| GET | `/v1/loop/capabilities` | no | 0 |
| POST | `/v1/loop/run` | Bearer key | 1 if the page loads |
| POST | `/v1/loop/brief` | Bearer key | 1 per page that loads |

```bash
curl -s https://api.talocode.site/v1/loop/run \
  -H "authorization: Bearer $TALOCODE_API_KEY" \
  -H "content-type: application/json" \
  -d '{"query":"Talocode official mint","url":"https://talocode.site/llms.txt","claim":"6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory"}'
```

The hosted route accepts public `https` URLs only. It refuses localhost, private addresses, and link-local addresses. The receipt returns the status, up to eight matching lines, and whether the claim was present. It does not return the page.

`usage.credits` is `0` when nothing loaded.

## What this does not do

It does not browse a logged-in site. `review` means every named source responded. It does not mean ship.

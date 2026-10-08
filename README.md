# Talocode Loop

The Talocode loop is one path: search, verify, trace, remember.

Same call locally and on the API server. A failing verify returns the error. It does not pretend the run succeeded.

## CLI

```bash
node bin/loop.mjs run --query="Talocode official mint" --url=https://talocode.site/llms.txt --claim=6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory
```

## MCP

```bash
node bin/loop.mjs mcp
```

Tool: `loop_run`.

## SDK

```js
import { TalocodeLoop } from "@talocode/loop";
const loop = new TalocodeLoop();
```

Set `TALOCODE_LOOP_URL` to call a hosted server.

## API server

```bash
node bin/loop.mjs serve --port=8787
```

`GET /v1/loop/health` and `POST /v1/loop/run`.

This route is not mounted on api.talocode.site yet.

---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Server-Sent Events

SSE is a browser-native protocol for unidirectional server-to-client streaming over a single long-lived HTTP connection — the right tool when you need push updates without the overhead of WebSockets or the polling tax.

### Core mechanism

SSE repurposes HTTP's streaming body. The server sets `Content-Type: text/event-stream` and keeps the connection open, writing newline-delimited text frames whenever it has data. The client's `EventSource` API handles reconnection automatically, using the `Last-Event-ID` header to resume from where it left off.

Each frame looks like:

```
id: 42
event: price-update
data: {"symbol":"AAPL","price":189.34}

```

The blank line is the frame delimiter. `id` enables resumption; `event` lets clients route to different handlers; `data` can span multiple lines. That's the entire protocol — it's intentionally minimal.

Under HTTP/2, SSE gets multiplexed for free — you can have multiple SSE streams on one connection without blocking other requests, which was a real limitation under HTTP/1.1 (browsers capped connections per domain at 6, and SSE would eat one).

### Mental model

Think of it as `tail -f` over HTTP. The connection stays open, the server writes lines as events happen, and the client processes them in order. The client cannot send data back on the same stream — it's read-only from the client's perspective. If you need bidirectional communication, that's what WebSockets exist for.

### Practical scenarios

**Backend:** Streaming LLM responses is the canonical modern use case — each token chunk is an SSE frame. You keep the HTTP handler alive, write chunks as the model produces them, then close the stream. No websocket upgrade negotiation, no protocol switching. Job progress, log tailing, and live metrics pipelines fit the same pattern.

**Frontend:** `EventSource` is built into every modern browser. You point it at a URL, attach event handlers, and it handles reconnection with exponential backoff automatically. The catch: `EventSource` doesn't support custom request headers out of of the box (no `Authorization: Bearer ...`), so auth is usually done via cookie or a query param token — something to account for in your security model.

**Fullstack:** SSE is common in Next.js/React apps for streaming AI completions. The server route streams SSE, the client reads it with `fetch()` and `ReadableStream` (or `EventSource` if you don't need custom headers), and the UI updates incrementally. This is also how tools like Claude's web UI stream responses.

### When not to use it

If you need the client to send messages back at high frequency (multiplayer game state, collaborative editing), reach for WebSockets. SSE's unidirectionality is a tradeoff, not an oversight — it keeps the implementation simple and compatible with standard HTTP infrastructure like proxies and load balancers.

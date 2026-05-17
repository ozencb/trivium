---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Server-Sent Events

SSE is HTTP doing what it was always capable of but rarely asked to: keeping the response body open indefinitely and dripping data down it. The server holds the connection, writes newline-delimited text whenever it has something to say, and the client's `EventSource` API handles reconnection automatically. No upgrade handshake, no binary framing, no bidirectional channel — just a persistent GET response.

**The mechanism**

The server sets `Content-Type: text/event-stream` and starts writing chunks that follow a simple format:

```
data: {"user": "alice", "action": "joined"}\n\n
```

Double newline terminates each event. Optional fields like `id:` and `retry:` let the server control client reconnection behavior — the browser will re-issue the request with a `Last-Event-ID` header, so you can resume streams without missing events if your server tracks IDs. The transport is plain HTTP/1.1 or HTTP/2; you get HTTP/2 multiplexing for free on supporting clients without any extra work.

**Where it fits**

SSE solves a specific problem: you need the server to push updates, but the client never needs to send anything mid-stream. Dashboard metrics, live feed updates, build logs, notification toasts — these are all one-directional by nature. Reaching for WebSockets here is over-engineering: you get bidirectional complexity you don't use, and you lose HTTP semantics (auth headers, caching, proxying) that SSE preserves.

**The pitfalls that bite people**

Browser connection limits per domain apply — SSE uses a persistent connection, so if a user opens 6 tabs all subscribing to the same SSE endpoint, they'll hit the limit under HTTP/1.1. HTTP/2 solves this via multiplexing, but if your infrastructure terminates HTTP/2 at the load balancer and speaks HTTP/1.1 to your app, tabs are still competing for connections.

Proxy and CDN timeouts kill quiet streams. If no data flows for 30–60 seconds, many reverse proxies close the connection. Send periodic heartbeat comments (`:\n\n`) to keep it alive.

**Mental model**

Think of it as a log `tail -f` that works over HTTP. The client opens a request, the server writes lines as events happen, and the connection stays open until something kills it. The `EventSource` API is just `tail -f` with automatic restart on disconnect.

**Practical angles**

- **Backend**: emit events from whatever pubsub/queue you already have; the SSE endpoint is a thin adapter that subscribes and flushes to the response writer.
- **Frontend**: `EventSource` is built into every modern browser, so no library needed — just listen for named event types with `addEventListener`.
- **Fullstack**: SSE is the right call for AI token streaming (one-directional by nature), real-time log viewers, and live collaboration presence indicators where you control writes through a separate REST call.

When the client also needs to push structured data mid-session, that's when WebSockets earn their complexity. Until then, SSE is the right level of abstraction.

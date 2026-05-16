---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Long polling is a technique for pushing data from server to client before true server-push protocols existed — it simulates real-time updates over plain HTTP by exploiting the request lifecycle.

## The Mechanism

Normal HTTP is pull-only: client requests, server responds immediately, connection closes. If you need fresh data, you poll on an interval — but that's wasteful (empty responses most of the time) and introduces latency proportional to your interval.

Long polling flips the timing. The client makes a request, but the server **holds the connection open** rather than responding immediately. It only responds when it has new data to send (or a timeout elapses). The client receives the response, processes it, and immediately opens another long-poll request. From the outside it looks like a persistent update stream.

The key insight: HTTP doesn't require immediate responses. You can hold a connection in a pending state server-side, and the client's socket stays open the whole time. Nothing in TCP says the response has to come fast.

## Concrete Mental Model

Think of a courier waiting at a post office: instead of checking every 5 minutes whether a package has arrived ("short polling"), they just stand there until one comes in. Once they get the package and deliver it, they return to wait for the next one. The server is the post office, the client is the courier.

## Practical Scenarios

**Backend:** You hold the incoming request in memory (e.g., a queue or a map keyed by client ID), and when an event fires — a new message, a job completing, a price update — you look up any waiting requests and flush them. Server frameworks handle concurrent held connections via async I/O (Node.js event loop, Go goroutines, async Python). The scaling concern is connection count, not CPU.

**Frontend:** You chain requests manually. `fetch` resolves, you handle the response, then immediately call `fetch` again. You also need to handle timeouts gracefully — if the server closes with no data (keep-alive timeout), reopen without treating it as an error.

**Fullstack:** Long polling is how early chat apps (Facebook, GMail) pushed notifications before WebSockets were standardized. It's also still the correct choice when WebSockets are unavailable (some proxies/firewalls block upgrades) or when you need request-level auth semantics that don't carry over to WebSocket connections cleanly.

## Why It Matters for WebSockets

WebSockets are the upgrade from long polling — they give you a true bidirectional channel instead of a sequence of one-directional held requests. Long polling's architecture (hold, respond, re-request) is a useful mental model because WebSockets solve the same problem but collapse that cycle into a single persistent connection with a framing protocol on top.

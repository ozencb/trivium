---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

WebSockets give you a persistent, full-duplex TCP connection between client and server — solving the fundamental mismatch where HTTP's request/response model forces you to poll for state changes rather than receive them.

## The Mechanism

WebSockets start as HTTP. The client sends a regular GET with two key headers:

```
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: <base64-random>
```

The server responds with `101 Switching Protocols`, and from that point on the TCP connection is no longer HTTP — it's a framed binary protocol. Both sides can now send frames at any time without waiting for the other to request them.

The framing layer is lightweight: each message has an opcode (text, binary, ping, close), a masking bit (client→server frames are always masked to prevent cache poisoning by proxies), and a payload length. That's mostly it. No headers per message, no content negotiation.

One important subtlety: the connection multiplexes over a single TCP connection, so head-of-line blocking applies. One large message can stall others. This is why some protocols layer their own message IDs on top.

## Mental Model

Think of HTTP as a letter — you send one, you get one back, the exchange is done. WebSockets are a phone call: the line stays open, either party speaks when they have something to say, and there's no per-utterance overhead.

## Practical Scenarios

**Backend:** You're managing a WebSocket connection per client, which means state in memory. This complicates horizontal scaling — if a user connects to server A, but an event happens on server B, B needs a way to fan that event to A's connection. Typical solution: a pub/sub layer (Redis, NATS) so all instances can broadcast to all connections regardless of which instance holds them.

**Frontend:** The browser `WebSocket` API is straightforward, but you'll almost always want a library (Socket.IO, or a thin reconnection wrapper) because the native API gives you no reconnection logic. If the connection drops, you're on your own. Also: WebSockets don't automatically carry cookies or auth headers beyond the initial HTTP upgrade — you typically authenticate via a token in the URL or in the first message after connecting.

**Fullstack:** The interesting tension is between WebSockets and SSE (Server-Sent Events). SSE is unidirectional (server→client only), but it's HTTP — so load balancers, proxies, and auth all just work. For something like live notifications or dashboards where the client never pushes data, SSE is often less operationally painful. WebSockets earn their complexity when you need bidirectional flow: collaborative editing, multiplayer, chat.

The persistent connection model is powerful but shifts your operational model — you're no longer stateless per request, and connection lifecycle (connect, reconnect, heartbeat, teardown) becomes explicit work you have to handle.

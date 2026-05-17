---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## WebSockets

HTTP is fundamentally request-response: the client speaks, the server answers, the connection closes. When you need the server to push data unprompted — a chat message arriving, a stock price ticking, a collaborator's cursor moving — that model forces you into polling hacks that waste bandwidth and add latency. WebSockets solve this by reusing the HTTP connection but switching it into a persistent, bidirectional channel once the handshake completes.

**The actual mechanism**

The client sends a normal HTTP/1.1 request with two key headers: `Upgrade: websocket` and a `Sec-WebSocket-Key` (random base64 bytes). The server responds with `101 Switching Protocols` and a derived `Sec-WebSocket-Accept` (SHA-1 of the key + a magic string, base64-encoded). After that, the TCP connection stays open but the protocol has changed — both sides now exchange frames with 2–14 bytes of overhead instead of full HTTP headers. Frames have a type (text, binary, ping/pong, close) and a masking bit: client→server frames are masked to prevent transparent proxies from caching or corrupting them.

**Mental model**

HTTP is postal mail — you send a letter, wait for a reply. WebSockets are a phone call. Once the call connects, either party can speak at any time without the other having to prompt them.

**Where it matters in practice**

*Backend*: Connections are stateful and long-lived, which breaks the stateless HTTP mental model. The moment you run two server instances, you need sticky sessions or a pub/sub broker (Redis, Kafka) to route messages across nodes. You also own the connection lifecycle — heartbeats via ping/pong frames, detecting dead connections, clean shutdown. This operational weight is real.

*Frontend*: The native `WebSocket` browser API is minimal: `onopen`, `onmessage`, `onerror`, `onclose`. Production apps almost always layer a library on top (Socket.IO, PartyKit) to get reconnection logic and backoff. A common design mistake is treating the WebSocket as a free-for-all message pipe — you need an application-level envelope (type + payload) from day one or the handler code becomes a mess.

*Auth*: Cookies attach automatically on the initial HTTP upgrade, so session-based auth works. JWTs are the gotcha — after the upgrade, there's no header mechanism, so people are tempted to pass tokens in the query string (logged by every proxy, don't do it). The correct pattern is to send a short-lived token in the first application message after `onopen`.

**When to reach for it (and when not to)**

Reach for WebSockets when you have sub-second latency requirements, need server-initiated push, or have genuine bidirectionality: collaborative editing, multiplayer games, live dashboards, chat.

Skip it for: infrequent server events (Server-Sent Events are simpler, unidirectional, auto-reconnect for free), fire-and-forget notifications (push notifications), or serverless environments where long-lived connections are either unsupported or expensive per-minute.

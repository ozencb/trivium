---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Long Polling

Long polling is a technique where the client sends an HTTP request and the server deliberately delays responding until it has something meaningful to send — then the client immediately re-issues the request. It's the closest approximation of server-to-client push that standard HTTP allows without persistent connections.

### The Mechanism

Normal polling: client asks "anything new?" every N seconds, server always responds immediately (usually "nope"). This generates noise proportional to your polling interval regardless of activity.

Long polling flips the model. The server holds the request open — potentially for seconds or minutes — blocking in a suspended state until an event occurs or a timeout is hit. When data arrives, the server responds, and the client fires off a new request immediately. From the outside it looks like a live feed; underneath it's a rapid succession of request/response cycles.

The server-side implementation usually looks like: receive request, register a listener or join a wait queue, suspend the handler, and resume (or time out) when new data comes in. Timeouts matter because proxies and load balancers silently kill idle connections — so you respond with an empty payload after ~30s and let the client retry.

### Mental Model

Think of it like a restaurant where you ask the waiter "is my order ready?" and instead of walking back to ask every two minutes, you stand in the kitchen doorway until the chef either hands you the plate or asks you to wait outside after 30 seconds so you don't block traffic.

### Practical Scenarios

**Backend:** Long polling creates connection-per-client pressure. If 10,000 clients are polling, you're holding 10,000 open connections — each consuming a thread or file descriptor depending on your server model. Node.js handles this better than thread-per-request Java, because async I/O means a suspended long poll doesn't block a thread. The bigger risk is your load balancer's idle timeout killing connections before your server does, causing the client to receive a silent disconnect it may not handle gracefully.

**Frontend:** You implement it with a recursive fetch-then-retry loop rather than `setInterval`. Error handling matters here — network failures, 502s from proxy timeouts, and intentional 204/empty responses all need distinct handling. If you just retry on any error without backoff, you'll hammer the server during an outage.

**Fullstack:** Long polling is a reasonable choice when WebSockets are blocked by your infrastructure (some corporate proxies strip upgrade headers) or when you need simple stateless delivery without the operational overhead of managing persistent connections. It's also easier to scale horizontally since each request is self-contained — no sticky sessions required unless you're doing server-side fan-out.

### When to Reach For It

Use it when you need near-real-time updates, WebSockets aren't available, and connection volume is manageable. Beyond a few thousand concurrent clients, the connection overhead becomes the bottleneck — which is exactly why WebSockets (and Server-Sent Events) exist to replace it.

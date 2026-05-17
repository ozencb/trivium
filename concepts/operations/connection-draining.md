---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Connection Draining

When you pull a backend out of rotation — whether for a deploy, scale-down, or health reason — the load balancer needs a way to stop sending it *new* work while letting it finish *existing* work. That window is connection draining: the backend is marked as deregistering, gets no new connections, and has a bounded time (the drain timeout) to finish in-flight requests before it's terminated.

### The Mechanism

The flow is three steps:

1. **Signal**: something (deploy pipeline, autoscaler, health check failure) tells the load balancer to deregister this target.
2. **Drain**: the LB stops routing new connections to it, but existing connections stay open. The backend keeps processing them.
3. **Terminate**: after the drain timeout expires (or all connections close naturally, whichever comes first), the process is killed.

The drain timeout is the critical knob. Too short and you're still dropping requests. Too long and your deploy hangs or your autoscaler scale-down is sluggish. Most teams set it to p99 request latency plus a buffer — if your API is usually under 500ms, a 30s drain timeout is plenty. But if you have long-lived streaming connections or batch jobs that take minutes, that assumption breaks.

### Concrete Example

Imagine your service handles file uploads. A user starts uploading a 200MB file. Mid-upload, a deploy fires. Without draining, the LB immediately stops sending that backend traffic and the upload dies. With draining, the LB deregisters the backend, but the active upload connection stays open. The backend finishes receiving the file, returns 200, and *then* gets killed. Zero user impact.

### Practical Scenarios

**Backend**: If you have long polling, WebSockets, or chunked streaming, your effective drain timeout needs to account for the worst-case connection duration — not your median API latency. Configure shutdown handlers in your app to stop accepting `Accept()` calls (or reject new HTTP keep-alive reuse) while still processing the active request loop.

**SRE**: Drain timeout mismatches are a common source of "ghost 502s" during deployments that are otherwise hard to reproduce locally. Correlate deploy timing with error spikes in your LB access logs — if errors peak in a narrow window right at deploy, draining is misconfigured or too short.

**DevOps**: Cloud LBs (ALB, GCP LB, etc.) each have their own drain timeout setting, separate from your app's graceful shutdown timeout. Both need to be aligned — if your app shuts down in 10s but the LB drain window is 30s, the LB is still routing connections to a dead process for 20 seconds. The LB drain timeout should be shorter than or equal to the app's SIGTERM-to-exit window.

The main pitfall: people configure graceful shutdown in their app but forget to set the drain timeout on the LB side, so the LB kills connections anyway. Both layers need to cooperate.

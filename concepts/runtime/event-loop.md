---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Event Loop

The event loop is the scheduler that makes single-threaded concurrency possible: it continuously drains a queue of callbacks, dispatching them one at a time, interleaved with the work of waiting on I/O. The core insight is that most "concurrent" work in server and browser environments isn't CPU-bound—it's waiting—so you don't need threads to handle thousands of simultaneous operations.

**The mechanism**

The loop itself is almost embarrassingly simple:

```
while (queue is not empty or I/O pending):
    event = dequeue next callback
    execute event to completion
```

The invariant that everything hangs on: *a callback runs to completion before the next one starts*. There's no preemption, no context switching mid-function. This eliminates entire categories of concurrency bugs—no mutex needed to protect shared state because nothing else can mutate it while you're running.

What makes it non-trivial is the interaction with the OS. When you call `fs.readFile()` or `fetch()`, the runtime hands the I/O descriptor to the OS (via `epoll`, `kqueue`, `io_uring` depending on platform) and immediately returns. The OS signals readiness later; the runtime picks that up, wraps your callback, enqueues it. The event loop then dispatches it when the current call stack is clear.

Browsers add more structure with the concept of *task queues* and *microtask queues*. Promises resolve via microtasks, which drain completely after each task before the next task runs—which is why `Promise.resolve().then(...)` always fires before `setTimeout(..., 0)`, even if both are queued at the same moment.

**The pitfall that bites everyone**

Because callbacks run to completion, any synchronous work you do inside one blocks the entire loop. A 200ms CPU-bound calculation (e.g., parsing a large JSON payload, running an unoptimized regex on a big string) stalls every other pending callback for 200ms. In Node, that means all in-flight HTTP requests stall. In a browser, that means the UI freezes.

**Where this matters in practice**

- **Backend (Node.js):** The event loop is why a single Node process can handle thousands of concurrent HTTP connections. The failure mode is CPU-heavy work on the main thread—push that to worker threads or a separate service.
- **Frontend:** Understanding why `setTimeout(fn, 0)` defers work, why blocking the main thread kills scroll performance, and why `requestAnimationFrame` exists—all follow directly from the event loop model.
- **Fullstack / SSR:** Server-rendered React running in Node hits the same constraints. A slow `getServerSideProps` that does synchronous CPU work will degrade all concurrent requests, not just the one that triggered it.

The model to hold in your head: a single fast worker with an inbox. It empties the inbox one item at a time. Anything that makes processing one item slow poisons throughput for everything else.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## JavaScript Memory Profiling

JavaScript runs in a garbage-collected runtime, but "garbage collected" doesn't mean "leak-proof." Memory profiling is the practice of finding objects that *should* be freed but aren't — because something in your code still holds a reference to them, even unintentionally.

### The core mechanism

The JS engine's GC operates on reachability: any object reachable from a root (window, active closures, event listener callbacks) stays alive. A leak isn't a bug where memory isn't freed — it's a bug where *your code accidentally maintains a reference* that prevents the GC from freeing it. The memory grows steadily over time, session by session, until the tab crashes or slows to a crawl.

The three most common culprits:

**Detached DOM nodes** — You remove a node from the DOM, but a JS variable or closure still references it. The node is "detached" — out of the visible tree, but alive in the heap. This is extremely common with dynamically-built lists, modals, or charts that get torn down and rebuilt.

**Accumulated event listeners** — You call `addEventListener` on a component mount but never call `removeEventListener` on teardown. In SPAs with client-side routing, components mount/unmount dozens of times per session, each time registering a new listener on a long-lived element like `window` or `document`.

**Retained closures** — A callback captures a large object (say, a full API response) in its scope. The callback is held by an event emitter or a timer that never gets cleared. The entire captured scope stays in memory.

### Mental model

Think of the heap as a graph. Nodes are objects, edges are references. GC walks the graph from roots and marks everything reachable. Leaks are islands that *should* be unreachable but aren't, because one stray edge still connects them to the mainland.

### In practice

**Frontend:** In a React or Vue app, the typical culprit is a `useEffect` or `mounted()` hook that wires up a WebSocket, a third-party event emitter, or a `setInterval` — without a cleanup function. After 20 route navigations, you have 20 active subscriptions. The Chrome Memory panel's Allocation Timeline shows you heap size increasing in sawtooth waves instead of flat-lining.

**Fullstack:** Node.js services are equally susceptible. A common pattern: a request handler that registers a listener on a shared EventEmitter (like an internal pubsub or an SDK client) but never deregisters it. Under load, you accumulate thousands of listeners. Node will warn you with `MaxListenersExceededWarning`, but by then you're already leaking.

### Why this differentiates senior engineers

Junior engineers fix performance by optimizing render cycles or reducing bundle size. Senior engineers know that a 400ms render that runs fine for 5 minutes can become a 4-second render after 30 — because the heap has grown 10x with retained objects. Profiling tools (heap snapshots comparing before/after an action, allocation timelines, the Detached DOM filter) let you make that argument with evidence, not intuition.

---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## JavaScript Memory Profiling

JavaScript runs in a managed memory environment, but "managed" doesn't mean leak-proof. Memory profiling is how you observe the V8 heap over time to find allocations that survive longer than they should.

### The Core Mechanism

V8 splits heap memory into spaces (new space for short-lived objects, old space for survivors). The garbage collector runs mark-and-sweep cycles, freeing anything unreachable. Profiling hooks into this at two levels:

- **Heap snapshots**: a point-in-time serialization of every live object, its size, and its retention path (the chain of references keeping it alive)
- **Allocation timelines**: continuous recording of allocation events so you can see *when* memory was allocated and whether it was ever freed

The key insight: a leak isn't an object that's large, it's an object that's *retained unintentionally*. The profiler's job is to surface retention paths — who's holding a reference that prevents GC.

### Mental Model

Think of your virtual memory background: a page is "in use" as long as something references it. Same idea here. If a closure captures a reference to a 50MB array and that closure is registered as an event listener that never gets removed, the array never gets collected. The retention path would look like: `EventTarget → listener fn → closure scope → array`.

Heap snapshots let you take two snapshots (before and after a user interaction, say) and diff them — anything that grew between snapshots and wasn't expected is a suspect.

### Practical Scenarios

**Frontend**: The classic case is SPAs with client-side routing. A component unmounts but leaves behind a `setInterval`, a WebSocket handler, or a third-party analytics listener. Each navigation cycle leaks a bit more. After 20 route changes, you've got 20 copies of whatever that component held in scope. You'd catch this by taking a heap snapshot on first load, navigating repeatedly, forcing GC, then diffing — the retained object count for that component's data should be 1, not 20.

**Fullstack (Node.js)**: Long-running servers accumulate leaks differently. A request handler that caches parsed request bodies in a module-level Map, but the cleanup logic has a bug and keys never evict. Under load, RSS climbs steadily. Allocation timelines in Node (via `--heap-prof` or Chrome DevTools connected to `--inspect`) show the callsite responsible for the growing allocations. The fix is obvious once you can see *where* the retained objects were created.

### What to Actually Look At

In Chrome DevTools Memory tab: take a snapshot, do the thing, force GC (`gc()` in console with DevTools open), take another snapshot. Switch to "Objects allocated between snapshots." Sort by retained size. Any constructor you recognize that has more instances than expected is worth drilling into its retainers panel.

The tool surfaces evidence; you still have to read the retention path and reason about why the reference exists.

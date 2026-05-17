---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Memory Leak Detection

In garbage-collected runtimes, a "leak" isn't a forgotten `free()` — it's an object that remains reachable (so the GC won't collect it) but will never be used again. Detection is the process of finding those objects in the heap and tracing the reference chain that's keeping them alive.

### Core Mechanism

GC roots — globals, stack frames, active goroutines/threads — form reference trees. The GC only collects things that fall outside those trees. A leak means something *inside* the tree is growing without bound: a cache with no eviction, an event emitter accumulating listeners, a map that adds entries but never removes them. Because they're reachable, the GC considers them live. They're your problem, not its.

Heap profilers work by snapshotting the heap at two moments and diffing them — what grew, and which allocation sites are responsible? Allocation samplers (Go's `pprof`, JVM's async-profiler) instrument a fraction of allocations with stack traces, so you can answer "where is this type being created?" at low runtime cost. The key metric isn't peak heap size, it's *retained* objects over time.

Mental model: a conveyor belt loading boxes into a warehouse. GC sweeps the belt (stack, short-lived allocations). But if boxes keep getting moved into the warehouse (long-lived heap), the warehouse fills up — GC never enters. You have to audit the warehouse yourself.

### Concrete Example

A Go HTTP server uses a `map[string]*Session` as an in-memory session store. Sessions are added on login, removed only on explicit logout. Users who close the browser leave entries forever. The map is a package-level variable — always reachable, never collected. Over weeks, RSS climbs ~50MB/hour until the pod gets OOM-killed. A `pprof` heap diff over 24 hours shows `*Session` count growing linearly with uptime, not with traffic. That's your leak.

### Backend

The most common sources: middleware registering callbacks without deregistering, append-heavy slices where `len < cap` but the backing array holds references, request-scoped data accidentally promoted to package scope, or connection pools that accumulate without draining. The pattern is always a long-lived container accumulating short-lived things with no eviction path.

### SRE

This shows up as slow RSS creep on dashboards — not a spike, a steady climb. The first instinct is scheduled pod restarts, which masks it. The correct path: capture heap profiles before and after a traffic window, diff them. Cross-reference memory growth rate vs. request rate — if memory grows during low traffic, it's a structural leak, not load pressure. Trigger a GC before snapshotting (where the runtime allows it) to flush short-lived noise and make retained-but-dead objects visible in the diff.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Garbage Collection

GC is the runtime's mechanism for automatically reclaiming heap memory your program can no longer reach—no manual `free()` required. The tradeoff is that "automatically" doesn't mean "free": the collector must occasionally pause your program or run concurrently with it, and that pause has latency implications you need to reason about explicitly.

**Core Mechanisms**

Three main strategies, each with different invariants:

**Mark-and-sweep**: The collector starts from "roots" (stack variables, globals, registers) and traces all reachable objects, marking them. Everything unmarked is swept. Handles cycles, but requires a full heap scan. Classic stop-the-world behavior.

**Reference counting**: Each object tracks how many references point to it; count hits zero, it's freed immediately. Python, Swift ARC. Deterministic, low-pause—but structurally can't collect cycles. Two objects referencing each other keep each other alive forever. Python patches this with a separate cycle detector running on top.

**Generational collection**: Built on the observation that most objects die young—the "generational hypothesis." The heap splits into generations: a small, frequently-collected nursery for new allocations, and older generations collected rarely. JVM, .NET, V8 all use this. Nursery collections are fast because the space is tiny and mostly dead; full-heap collections happen infrequently. This is why it works so well in practice.

**Mental Model**

A janitor who can't clean while people are in the building. Stop-the-world locks everyone out, cleans thoroughly, reopens. Concurrent GC lets people stay but the janitor must avoid moving furniture someone's sitting on. Incremental GC cleans one room at a time between interactions. Each approach trades pause duration against throughput overhead and implementation complexity.

**In Practice**

*Backend (JVM)*: Long GC pauses are the canonical source of P99 latency spikes. A 200ms stop-the-world is invisible in average latency but destroys tail latency. Levers: increase heap size (less frequent GC, but longer pauses when they hit), switch collectors (G1, ZGC, Shenandoah trade throughput for pause bounds), or reduce allocation rate by reusing objects.

*Frontend (V8)*: V8's generational GC is tuned for short-lived DOM objects. The danger is creating large, long-lived structures—caches, retained closures, detached DOM nodes—that escape the nursery and bloat old-gen. That triggers expensive major GCs mid-interaction, causing jank. This is exactly what JavaScript memory profiling is measuring: what's escaping into old-gen and why.

*Node.js*: Same V8, but long-running processes accumulate old-gen objects in ways browsers never do—browsers reload pages, servers don't. Memory leaks that self-heal in a browser become on-call incidents in production.

The practical skill GC unlocks: reading heap snapshots and allocation timelines to find what's surviving collection when it shouldn't be.

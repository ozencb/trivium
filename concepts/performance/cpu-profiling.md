---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CPU Profiling

CPU profiling answers "where is my program actually spending time?" with data instead of intuition. Without it, optimization is guesswork—with it, you find that the 3-line function called a million times matters more than the 200-line function called once.

**The core mechanism**

There are two approaches. *Sampling* profilers interrupt execution at a fixed interval (say, every 1ms), capture the current call stack, and do this thousands of times. The result is statistical: if a function appears in 40% of samples, it's consuming ~40% of CPU. Low overhead, safe for production, good enough for most problems.

*Instrumentation* profilers inject hooks at every function entry and exit, giving exact call counts and durations. More precise, but the overhead can distort what you're measuring—a function that looks slow under instrumentation might be fine in reality.

Both approaches produce flame graphs. The x-axis is cumulative time (or sample count), the y-axis is call stack depth. A wide bar means that frame and everything it calls is eating CPU. A narrow bar deep in the stack is noise. You're hunting wide plateaus near the top.

**Concrete mental model**

Think of it like X-rays of your program running. Each sample is a snapshot of the call stack. Stack them thousands of times and patterns emerge visually. If `JSON.stringify` shows up 3 frames deep in 60% of samples, that's your target—not the business logic you suspected.

Since you know GC: profilers expose GC pressure directly. If you see `gc` or `runtime.GC` eating 15% of your flame graph, that's a memory allocation problem, not a CPU problem—and now you know to profile allocations instead.

**Where this shows up in practice**

*Backend*: A Node.js API is slow under load. Profiling reveals `bcrypt.compare` being called synchronously on the main thread—obvious in hindsight, invisible without data. Or a Go service profile shows 40% in JSON serialization, leading you to switch to a binary protocol or cache serialized responses.

*Frontend*: A React app stutters during scroll. Chrome DevTools profiler shows `filterProducts` re-running on every frame because it's not memoized, recalculating an expensive sort on a 10k-item array.

*SRE*: CPU spikes to 100% at 2am but nobody's investigating yet. A profiling snapshot from that window (some tools capture continuously) shows a cron job doing unbounded DB scans. Without the snapshot, you're hunting through logs.

*Fullstack*: A Next.js SSR page is slow. Server profiling shows the bottleneck is in data fetching/serialization, not rendering—meaning optimizing the React components would have done nothing.

**When to reach for it**

Profile before optimizing anything non-trivial. The #1 mistake is optimizing the code you wrote, not the code that's slow. Profiling is cheap; misallocated optimization effort isn't.

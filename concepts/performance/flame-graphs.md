---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Flame Graphs

A flame graph takes the raw output of a CPU profiler — thousands of sampled call stacks — and collapses them into a single visualization where width directly encodes time. Instead of scanning through a table of percentages or reading nested call counts, you see immediately which code paths own the CPU.

### How it actually works

A CPU profiler interrupts execution at a fixed interval (say, every 10ms) and records the current call stack. After thousands of samples, you have a frequency distribution of stacks. The flame graph renders this by:

- **Y-axis**: call stack depth. Bottom is the entry point (e.g., `main`), top is the leaf function actually executing.
- **X-axis**: *not* time order — this is a common misconception. It's sorted alphabetically at each level to enable merging identical sub-stacks. Width equals the proportion of samples containing that frame.

So a wide bar means that function appeared in many samples, meaning the CPU spent proportional time either in it or in something it called.

### Mental model

Imagine stacking identical call stacks on top of each other and then squishing duplicates together sideways. The result is a shape where wide flat plateaus near the top are your hot code — execution arrived there and stayed. Narrow spikes are fast paths you can ignore.

### What to look for

- **Wide plateau near the top**: the actual CPU sink. This is where you optimize.
- **Wide bar mid-stack with narrow children**: a function calling many different things. Possibly worth examining, but less actionable than a plateau.
- **Unexpectedly deep stacks**: frameworks or ORMs doing more than you assumed.

### In practice

**Backend (Go/Java/Python)**: You add a `/debug/pprof` endpoint or attach async-profiler, load under realistic traffic, pull a 30-second profile, and open the flame graph. The first surprise is usually serialization (JSON marshaling, protobuf) or a lock contention path you assumed was cheap.

**SRE**: CPU spike fires a PagerDuty alert. Instead of guessing which service component is responsible, you pull a continuous profiler snapshot (Pyroscope, Parca, or cloud-native equivalents) covering the spike window. The flame graph shows you the diff between normal and degraded state.

**Fullstack (Node.js)**: `node --prof` + `node --prof-process` or clinic.js. React SSR apps often show wide bars in template rendering or hydration serialization that don't appear in unit tests but dominate under load.

### Common pitfalls

- **Sampling rate too low**: short hot functions get missed entirely.
- **JIT/inlining**: V8 and JVM can inline or compile away frames, making the graph misleading. Use async-profiler in Java's safepoint-free mode.
- **On-CPU vs off-CPU confusion**: standard flame graphs only show time the CPU was *running* your code. If you're blocked on I/O or a mutex, you need off-CPU profiling (different tooling entirely).

The real value is that you stop guessing and start measuring. Most "obvious" bottlenecks turn out to be wrong.

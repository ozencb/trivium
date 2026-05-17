---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Swap and Swapping

When physical RAM is exhausted, the OS evicts cold memory pages to a reserved area on disk (the swap space) to make room for active ones. The cost is severe: disk I/O is 100–1000x slower than RAM, so any access to a swapped-out page blocks until the kernel reads it back.

### The mechanism

The Linux kernel maintains LRU page lists and tracks which pages haven't been accessed recently. When free memory drops below a watermark, `kswapd` wakes up and starts evicting cold pages to swap. When a process later touches an evicted page, a **page fault** fires, execution stalls, the kernel reads the page back from disk (swap-in), and potentially evicts another cold page to make room (swap-out). If you're under sustained memory pressure, this swap-in/swap-out churn becomes continuous.

`vm.swappiness` (0–100, default 60) controls whether the kernel prefers evicting anonymous memory (heap, stack) vs. dropping filesystem cache. For latency-sensitive services, setting it to 1 tells the kernel: *prefer dropping file cache first, only swap as a last resort.*

### Mental model

RAM is your desk. Swap is a filing cabinet across the room. When the desk is full, you put untouched papers in the cabinet. Retrieval is slow, but manageable — until you keep needing those same papers, at which point you're making constant trips and getting nothing else done.

### Backend patterns

A JVM service under memory pressure will GC more aggressively, and between GC cycles, heap pages can get swapped out. When those pages are touched again, latency spikes. This looks exactly like "GC pause problems" or "slow endpoints" — the diagnosis lands on the application when the actual culprit is the OS. If tuning heap size or GC settings doesn't help, check whether the host is swapping.

Same pattern with Python workers: RSS grows gradually, swap kicks in, and suddenly p99 latency on your API doubles. The symptom is irregular, load-correlated spikes with no obvious code-level cause.

### SRE patterns

`vmstat 1` — watch the `si` (swap-in) and `so` (swap-out) columns. Nonzero `si` on a production host under load is a red flag. Cross-reference with `/proc/meminfo` SwapUsed and your latency percentiles.

For Kubernetes, set resource `requests == limits` to prevent the scheduler from packing more pods onto a node than RAM can support. The alternative is swap-induced thrashing followed by OOM kills — the kubelet evicts pods, but only after latency has already spiked.

One nuance: a small, stable swap usage isn't inherently bad. A nightly backup job parked in swap while inactive is fine. The bad pattern is *active, continuous swapping during normal load* — that's when it becomes a latency disaster.

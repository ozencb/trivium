---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Memory-Mapped File Performance

`mmap()` maps a file's bytes directly into your process's virtual address space, letting you read and write file data as if it were RAM — and the performance story is more nuanced than "it's faster."

### The Mechanism

With `read()`, touching file data costs you two copies: one from disk into the kernel's page cache, then another from the page cache into your user-space buffer. Two copies, at least one syscall per call, plus the overhead of managing that buffer yourself.

With `mmap()`, there's only one "copy" — the page cache frame itself is mapped into your address space. First access triggers a page fault; the kernel resolves it by mapping the relevant page cache frame directly. After that, subsequent reads are just memory accesses. No syscall per read, no second buffer.

The kernel's page eviction and prefetch machinery also works in your favor: sequential access patterns get detected and pages are prefetched ahead of your reads automatically.

### Mental Model

Think of `read()` as ordering food for delivery — you wait, it gets copied from the kitchen into a container, then handed to you. `mmap()` is a seat at the kitchen counter. You access the food directly where it's prepared; no intermediate handoff.

### Where It Wins

**Large files you read repeatedly, especially with random access patterns.** Because you're skipping the syscall overhead on each read, workloads that touch many small regions scattered across a large file (think B-tree traversal) perform significantly better.

**Backend:** Database engines exploit this heavily. SQLite and RocksDB have mmap modes precisely because B-tree page reads via `read()` would mean thousands of syscalls per query. Serving large static files or memory-mapped config stores benefit similarly.

**Data:** NumPy's `memmap`, Apache Arrow's IPC format, and memory-mapped Parquet readers all lean on this. When you're training an ML model on a 50GB dataset that doesn't fit in RAM, `mmap()` lets the OS page in only what's needed and evict the rest — your code never manages that explicitly.

### Where It Doesn't Win (or Loses)

- **Write-heavy random access**: dirty page tracking adds overhead; `write()` can be more predictable.
- **Very small files**: the setup cost (VMA allocation, TLB pressure) outweighs the savings.
- **Memory pressure**: under contention, the kernel can evict your mapped pages mid-loop, turning predictable latency into spiky page faults. `read()` into a buffer you control is more predictable in those cases.

The real leverage of `mmap()` isn't zero-copy magic — it's collapsing file I/O and memory access into the same operation, letting the OS's virtual memory subsystem handle caching and prefetch instead of you managing it manually.

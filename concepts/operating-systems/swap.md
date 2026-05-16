---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Swap and Swapping

When a system runs out of physical RAM, the OS doesn't crash — it extends memory onto disk by moving inactive pages out of RAM and into a reserved area called swap space. Swapping is the mechanism that makes this work without processes knowing their memory might be on disk.

---

### The Core Mechanism

Physical RAM is finite. The OS manages memory in pages (typically 4KB chunks), and each page in a process's virtual address space is either resident in RAM or not. When RAM is full and a process needs a new page, the OS must evict something.

The page replacement algorithm (LRU or approximations of it) picks a victim — typically a page that hasn't been accessed recently. That page gets written to swap space (a dedicated disk partition or file like `/swapfile`), and its page table entry is marked as "not present." The new page takes its slot in RAM.

When a process accesses a swapped-out page, it triggers a **page fault**. The hardware traps to the kernel, which reads the page back from disk into RAM, updates the page table, and resumes execution. The process never knew anything happened — from its perspective, the memory was always there.

---

### Why This Hurts

The cost difference is stark:
- RAM access: ~100ns
- NVMe SSD swap read: ~100µs (1,000x slower)
- Spinning disk swap: ~10ms (100,000x slower)

**Thrashing** is the pathological case: the system is so memory-constrained that it spends more time swapping pages in and out than doing actual work. Page fault rate spikes, CPU time in kernel context balloons, and throughput collapses. You'll see high `si`/`so` in `vmstat` (swap in/out rates) as the diagnostic signal.

---

### Backend Context

JVM processes are particularly sensitive. GC pauses become unpredictable when the heap spans swap — a minor GC that should take 20ms can balloon to seconds if it touches pages that need to be faulted in. Redis explicitly [recommends](https://redis.io/docs/management/optimization/latency/#latency-due-to-transparent-huge-pages) either disabling swap or setting `vm.swappiness=1` to push the kernel toward preferring RAM.

`vm.swappiness` (0–100) controls aggressiveness. At 0, the kernel swaps only when it has no other option. At 60 (default), it'll preemptively swap anonymous pages to keep file cache warm — often the wrong tradeoff for latency-sensitive services.

---

### SRE Context

Swap usage trending upward is a leading indicator of memory pressure, not just a lagging one. By the time you're seeing OOM kills, you've already blown past the warning. Track swap utilization and page fault rates as separate signals.

On Kubernetes: nodes historically required swap disabled (kubelet would refuse to start). As of 1.28, Kubernetes has alpha-level swap support, but it's still off by default — most production clusters treat swap as absent. A node running unexpectedly low on memory will trigger the OOM killer before any swapping helps, so resource limits and requests matter more than swap configuration in k8s environments.

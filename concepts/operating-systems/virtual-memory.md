---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Virtual Memory

Every process thinks it owns all of RAM. It doesn't — the OS is lying to it, and that lie is the foundation of how modern systems run dozens of processes without them trampling each other.

**The core mechanism**

Physical RAM is a flat array of bytes with real addresses. Virtual memory introduces a second address space per process: addresses that mean nothing to the hardware until the OS translates them. The CPU contains a Memory Management Unit (MMU) that intercepts every memory access and walks a *page table* — a per-process data structure the kernel maintains — to translate a virtual address to a physical one. This translation happens at the granularity of *pages* (typically 4KB chunks).

The page table maps virtual page numbers to physical *frames* (same size, just what physical RAM is divided into). A virtual page doesn't have to map to anything — if a process touches an unmapped page, the MMU fires a *page fault*, trapping into the kernel, which decides what to do: allocate a physical frame, load data from disk, or send SIGSEGV.

**Mental model**

Think of virtual addresses as seat numbers on a flight, and physical addresses as actual seat positions on the plane. Two passengers on different flights can both have "Seat 14A" — they're not fighting over the same seat because they're on different planes. The boarding pass (page table) resolves which physical seat each one actually occupies, and the gate agent (MMU) does the lookup on every boarding.

**Practical implications**

*Backend:* When you `malloc` memory, you're allocating virtual pages, not physical RAM. The kernel uses lazy allocation — physical frames are only assigned on first write. This is why a Go service can report 2GB of virtual memory but only 200MB of RSS; the rest is reserved address space that hasn't been touched. It also explains why memory leaks are dangerous: you can exhaust physical frames even if virtual address space is abundant.

*SRE:* Page faults show up in `perf stat` and `/proc/<pid>/stat` as minor faults (page already in RAM but not mapped yet) and major faults (page must be read from disk). A spike in major faults means you're hitting swap — your working set no longer fits in physical RAM and every cache miss becomes a disk read. `sar -B`, `vmstat`, and `oom_score_adj` all make sense once you understand that the kernel is constantly managing the gap between what processes believe they own and what physically exists.

The same mechanism that enables process isolation also enables page cache, memory-mapped files, and copy-on-write forking — all of which reuse this translation layer to make physical memory do multiple jobs at once.

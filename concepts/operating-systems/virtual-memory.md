---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Virtual memory** gives every process a private, contiguous address space that doesn't correspond directly to physical RAM — letting the OS multiplex real memory across many processes and back it with disk when RAM runs out.

## The core mechanism

Every 64-bit process gets a virtual address space (48 usable bits on x86-64 = 256 TB). These virtual addresses are fiction. When your code accesses `0x7fff...`, the CPU's MMU (Memory Management Unit) consults the process's **page table** — a data structure maintained by the OS — to translate that virtual address to a real physical RAM address.

Memory is managed in fixed chunks called **pages** (typically 4 KB). A page can be:
- **Resident**: mapped to a physical page frame in RAM
- **Not present**: on disk (swap), or never allocated yet

When you access a not-present page, the CPU raises a **page fault**. The OS handles it: loads the page from swap or zeroes out a new physical frame, updates the page table, and resumes your instruction. You never saw it happen.

## Mental model

Think of virtual memory as a very large sparse array. `malloc(1GB)` doesn't give you 1 GB of RAM — it reserves 1 GB of virtual address space. Physical pages are only allocated (faulted in) when you actually write to them. This is why a process can have a 10 GB virtual size (`VSZ`) but only 500 MB resident (`RSS`).

## Why it matters in practice

**Backend:**  
You've probably seen a Go or JVM process report 2 GB virtual size right after startup. That's not a leak — it's the runtime reserving address space speculatively (for GC arenas, thread stacks, etc.). What you actually need to watch is RSS. Also, `mmap`-based I/O (used by databases like Postgres and RocksDB) works by mapping file regions into virtual address space and letting the OS page them in/out on demand — this is the page cache exposed through the virtual memory interface.

**SRE:**  
OOM kills happen when physical RAM + swap is exhausted and the kernel can't honor a page fault. The kernel's overcommit behavior (`vm.overcommit_memory`) controls whether `malloc` can reserve more virtual memory than physically exists — by default on Linux it allows this, betting that not all processes will touch their full reservation simultaneously. When that bet fails, the OOM killer picks a victim. Swap is just the backing store for evicted pages; high swap I/O is a sign you're thrashing (evicting and re-loading the same pages repeatedly).

Understanding virtual memory is the prerequisite for reasoning about page cache (the OS using "free" RAM to buffer file I/O), memory-mapped files (files as virtual address ranges), and why swap isn't just "slow RAM" — it's the overflow mechanism for a system that routinely overcommits.

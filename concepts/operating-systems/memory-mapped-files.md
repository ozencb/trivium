---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Memory-Mapped Files

Memory-mapped files let you treat a file as if it were an array in RAM — you get a pointer, dereference it, and the kernel handles the I/O transparently. The payoff is avoiding explicit `read()`/`write()` syscalls and the userspace buffer copies that come with them.

### The core mechanism

When you call `mmap()`, the kernel doesn't read the file. It reserves a range of virtual addresses in your process and sets up a Virtual Memory Area (VMA) backed by the file's inode. That's it — no data moves yet.

The actual loading happens through the exact same page fault machinery that powers virtual memory. When you dereference one of those addresses and the page isn't in RAM, a page fault fires. The kernel locates the corresponding file offset, reads the page into the **page cache**, maps it into your page tables, and your instruction resumes as if nothing happened. The latency is the I/O cost; the mechanism is identical to demand paging anonymous memory.

Critically, the page cache is shared. Two processes mapping the same file share the same physical pages. This is why `MAP_SHARED` writes are visible to other mappers — you're all pointing at the same pages, and dirty ones get flushed back to disk by the kernel's writeback mechanism. `MAP_PRIVATE` gives you copy-on-write: writes fork the page into a process-private copy.

### Mental model

Think of it as `read()` that's lazy and zero-copy. With a normal `read()`, the kernel reads into a kernel buffer, then copies into your buffer — two buffers. With mmap, the page cache *is* your buffer. You get a pointer straight into it.

### Backend relevance

Databases lean on this heavily. SQLite's WAL mode uses mmap for reads by default. RocksDB has an `mmap_read` option. The argument is: let the OS manage the buffer cache instead of implementing your own in userspace. You get OS-level readahead, and the kernel's LRU eviction instead of a custom one. The tradeoff is losing control over I/O scheduling and getting unpredictable latency spikes when pages are evicted under memory pressure — which is why some databases (PostgreSQL) default to `pread()` and manage their own buffer pool.

For config or reference data that's read-once-at-startup and stays warm, mmap is nearly free repeated access after the initial fault.

### SRE relevance

When you see a process with high VSZ but modest RSS, that's often mmap — address space is reserved, but pages haven't faulted in yet. `pmap -x <pid>` or `/proc/<pid>/maps` will show you every mapped region with backing file and permissions. This matters when investigating memory leaks: anonymous `rw-p` regions growing over time are heap/stack; file-backed `r--p` regions are usually shared libraries or mmap'd data files, which don't count as "leaked."

Also relevant for performance analysis: `major_faults` in `/proc/<pid>/stat` counts page faults that required disk I/O. Elevated major faults on a process you expected to be in steady-state often means your working set exceeds available RAM and pages are being evicted and re-faulted.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Memory-Mapped Files

Instead of copying file data through kernel and user-space buffers via `read()`/`write()`, `mmap()` tells the kernel to alias a range of your virtual address space directly to a file. From that point on, reading those addresses *is* reading the file — the OS page fault mechanism handles the rest.

**The mechanism**

When you call `mmap()`, the kernel creates a virtual memory area (VMA) record — but loads nothing. The page table entries for that range are initially absent. The first access to any address in the range triggers a page fault. The fault handler looks up which file offset corresponds to that virtual address, pulls the page from the page cache (or from disk if it's cold), and inserts the page table entry. Subsequent accesses to the same page are pure memory ops — no syscall, no copy.

Critically, the mapped pages *are* the page cache. If another process already read that page via `read()`, it's the same physical frame. If two processes `mmap()` the same file with `MAP_SHARED`, they share physical pages and writes from one are immediately visible to the other.

For writes: with `MAP_SHARED`, modified pages are marked dirty and flushed to disk by the kernel's write-back mechanism (or explicitly via `msync()`). With `MAP_PRIVATE`, writes trigger copy-on-write — a private page is allocated and the original file is untouched.

**Mental model**

Think of it as delegating buffer management to the OS. You get a pointer; the OS decides when to bring pages in and when to evict them. The page cache is a shared pool, so frequently accessed file regions stay warm without you doing anything.

**Backend**

Databases lean on this heavily. LMDB maps its entire data file and relies on the OS to manage which pages are hot. RocksDB uses it for SST file reads. SQLite supports `PRAGMA mmap_size` for the same reason: random B-tree traversal becomes pointer chasing instead of `pread()` calls. The win is largest for read-heavy, random-access workloads where traditional buffering would just add a copy.

For serving large files, `sendfile()` is usually better (true zero-copy to the socket), but mmap works when you need to inspect or transform content in-process before sending.

**SRE**

Two common production puzzles it explains: a process's VSZ (virtual size) is gigabytes while RSS is modest — that's a large mmap with few pages faulted in yet. And a cold-start latency spike with a wall of page faults in `/proc/<pid>/stat` is the application warming its mmap'd files from disk.

The main pitfall: a file truncated while mapped causes `SIGBUS` on the next access to the now-invalid pages — not an errno you can catch cleanly. Disk I/O errors also surface as signals, not return codes, which makes error handling awkward. And eviction is outside your control, so under memory pressure the OS may evict pages you'd rather keep, causing unpredictable latency.

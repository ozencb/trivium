---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Memory-Mapped File Performance

`mmap` wins by eliminating the kernel-to-userspace copy that `read()` incurs: instead of copying page cache data into a userspace buffer, it maps those cache pages directly into your process's address space. But page faults aren't free, and random access patterns can make mmap slower than plain `read()`.

### The Mechanism

With `read()`: kernel copies data from the page cache into your buffer on every call. Two memory copies (DMA into page cache, then page cache into your buffer), plus a syscall boundary crossing each time.

With `mmap`: on first access to a page, a page fault fires, the OS loads the page into the page cache, and updates your process's page table to point directly at it. After that, accessing that memory is just a memory read—no syscall, no copy. The page cache *is* your buffer.

The win is real when your access pattern is warm (repeated) or sequential (prefetcher and OS readahead work). The loss is real when you're scattering accesses across a cold, large file—each miss is a page fault, which is a kernel trap. At scale, TLB pressure from many VMAs adds another tax.

### Mental Model

Think of `read()` as room service—reliable, controlled, but you pay per order. `mmap` is a fridge stocked by someone else; grabbing something already inside is instant, but if it's not there yet, you wait for delivery anyway, and the delivery cost is higher than room service's because it involves the kernel's page fault machinery.

### Where This Shows Up

**Backend / databases:** LMDB uses mmap for its data file precisely because reads during a transaction access recently-used pages that are hot in the page cache. RocksDB, by contrast, defaults to `pread()` because SST file access during compaction and reads is mixed sequential/random; page fault overhead at high concurrency outweighed the copy savings. Knowing why they made opposite choices is exactly the kind of thing that surfaces in system design conversations.

**Data pipelines / analytics:** NumPy's `mmap_mode='r'` and Apache Arrow's memory-mapped files work because columnar scans are sequential—you're reading column A start-to-finish, so the OS readahead keeps faults cheap. If you were doing row-oriented random lookups on the same file, you'd be paying fault overhead on every row.

### The Differentiating Question

Most engineers know mmap avoids copies. Senior-level reasoning is asking: *what's my access pattern, and what's my working set relative to available RAM?* Sequential + large file + repeated access = mmap wins clearly. Random + cold + high concurrency = `read()` or `pread()` with explicit buffering often wins. That conditional framing—not the rule of thumb—is what makes the difference in a design review.

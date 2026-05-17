---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Zero-Copy I/O** eliminates the round-trip through userspace when moving data between I/O sources—when you're just proxying data without transforming it, why should your process touch it at all?

**The normal path is more expensive than it looks.** A typical `read()` + `write()` to serve a file over a socket does: disk → page cache → kernel read buffer → userspace buffer → kernel socket buffer → NIC. That's four copies (two crossing the kernel/userspace boundary), two syscalls, and CPU cycles proportional to the data volume. The kernel/userspace boundary crossings are particularly costly—they require privilege mode switches and can pollute CPU caches.

**Zero-copy removes the middle legs.** The key insight: since you already understand page cache, you know the file data is sitting in kernel memory. The kernel *also* owns the socket buffer. So why involve userspace at all?

- `sendfile(in_fd, out_fd, offset, count)` tells the kernel to move data from a file descriptor directly to a socket. With DMA scatter-gather (standard on modern NICs), the NIC can read directly from page cache—zero CPU-driven copying.
- `splice()` generalizes this to arbitrary fd pairs using kernel pipe buffers as intermediaries.
- `io_uring` takes it further: batched async syscalls that can chain operations, reducing even syscall overhead for high-concurrency workloads.

You're not eliminating movement—you're eliminating *your process's involvement* in that movement. The hardware does it via DMA while your CPU does something else.

**Backend:** Nginx uses `sendfile` by default for static assets, which is why it can saturate a 10Gbps NIC serving files with trivial CPU load. If you write anything that pipes data from disk to network without modifying it—file servers, reverse proxies, media streaming—`sendfile` should be your default. Note: it requires knowing the content size upfront, and breaks immediately if you need to transform the data (TLS termination forces you back to userspace; no way around it).

**SRE:** When a service looks CPU-bound despite doing "nothing"—just proxying traffic—check for unnecessary copies. `strace` showing high-volume `read`/`write` pairs on a proxy is a red flag. Also watch page cache pressure: zero-copy paths are most beneficial when the working set fits in RAM. If pages are constantly evicted before the NIC can DMA them, you lose the benefit and add eviction overhead on top.

**The main pitfall** is that zero-copy is strictly for pass-through paths. Any inspection or mutation (compression, encryption, content rewriting) requires userspace involvement and breaks the zero-copy path entirely. Don't architect around zero-copy if your pipeline has transformation steps—it won't apply where you need it most.

Reach for it when profiling shows your bottleneck is memory bandwidth or per-byte CPU cost on data that you're not actually processing.

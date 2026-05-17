---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Copy-on-Write

Copy-on-Write defers the physical copying of memory until the moment a write actually occurs, letting multiple processes or data structures share the same physical pages as long as they're only reading. Operations that look expensive—forking a 4 GB process, snapshotting a B-tree, cloning a runtime heap—become nearly free until mutation happens.

---

**The mechanism**

When a process calls `fork()`, the kernel doesn't copy the parent's address space. It creates a new page table for the child pointing to the *same* physical frames as the parent, but marks every page in *both* processes read-only—even pages that were writable before. It also increments a reference count on each physical frame.

When either process writes to a shared page, the hardware raises a page fault (the page is read-only). The kernel's fault handler intercepts it, allocates a fresh frame, copies the original page's content into it, remaps the faulting process's virtual address to the new frame, restores write permission, and decrements the original frame's ref count. The write then proceeds normally.

The invariant the kernel maintains: a CoW-marked physical frame is never mutated in place—it's always copied first. Both processes always see a consistent view of any page they haven't written to.

**Mental model:** a shared document where everyone reads the same version. The moment someone edits, they get a private copy. The original stays intact for everyone else.

---

**Backend**

Redis uses CoW for `BGSAVE` and `BGREWRITEAOF`. Triggering a background save forks the process; the child serializes the dataset while the parent keeps serving writes. Those writes trigger CoW faults, so the child always sees the dataset as it was at fork time. The cost is memory: under a heavy write workload during a save, Redis can briefly approach 2× its normal RSS as pages get copied. That memory spike on your dashboard isn't a leak—it's CoW doing its job. PostgreSQL's MVCC similarly relies on keeping older page versions visible to concurrent readers while writers build new ones.

**SRE**

When a container OOMs right after a fork—a cron job, a health-check script that execs through the main process—CoW is often the culprit. The *dirty page ratio* matters: a process with lots of recently modified pages will copy far more on fork than one with a cold, read-heavy working set. `/proc/<pid>/smaps` exposes `Private_Dirty` vs `Shared_Clean`, telling you exactly how much has been copied versus still shared. Watching this metric during backup or snapshot windows gives you early warning before the OOM killer arrives.

The key thing to internalize: CoW trades time-of-fork cost for time-of-write cost. It's a great deal when reads dominate post-fork, and a bad deal when the forked process immediately writes aggressively to pages the parent also modifies.

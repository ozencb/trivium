---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Asynchronous I/O

When your thread asks the kernel for data — reading a file, waiting on a socket — the naive approach blocks: the thread sleeps until the kernel delivers. Async I/O flips this: you register interest in an I/O event, hand control back to a scheduler, and get notified when the data is ready. One thread can have thousands of in-flight operations simultaneously because it's never sitting idle waiting for any single one.

**The core mechanism**

The kernel exposes readiness APIs — `epoll` on Linux, `kqueue` on BSD/macOS, IOCP on Windows — that let you watch a set of file descriptors and ask "which of these are ready to read/write right now?" Your event loop calls into one of these, blocks *on the multiplexer* (not on any individual descriptor), and gets back a list of ready descriptors in one shot. This is the key invariant: the thread blocks exactly once per iteration of the loop, not once per I/O operation.

User-space runtimes (Node's libuv, Tokio, asyncio) wrap this into a promise/future/task abstraction. When you `await` a network read, you're not blocking the thread — you're suspending the current logical task and giving the event loop permission to run something else until the kernel signals readiness.

**Mental model**

Think of a single waiter at a restaurant. Blocking I/O means the waiter stands at the kitchen window, staring, until your food is ready — ignoring every other table. Async I/O means the waiter places the order, keeps a ticket, and circulates. The kitchen (kernel) rings a bell when something's done; the waiter retrieves it. One waiter handles the whole room.

**Where this bites you in practice**

The model breaks down the moment you mix in CPU-heavy work or blocking calls. A synchronous `fs.readFileSync` in a Node.js handler, a long regex match, a slow ORM query that calls a blocking DB driver — any of these stalls the event loop for everyone. The thread is no longer available to process readiness events. This is the canonical async footgun: accidentally blocking the event loop and silently serializing what you thought was concurrent.

**Backend**

This is why Node.js can handle 10k concurrent HTTP connections on a single core. Each request suspends during DB or upstream API calls, costs no thread, and the loop handles all of them. The tradeoff: CPU-bound work (image processing, crypto) must be offloaded to worker threads or separate processes.

**Fullstack**

On the client, the browser's event loop is the same architecture. Async I/O there means `fetch` calls, IndexedDB reads, and user events are all multiplexed through one loop. Understanding this explains why a long synchronous computation freezes the UI — you've stolen the loop.

Async I/O is the prerequisite for understanding structured concurrency (how to manage task lifetimes) and event loops (what's actually running that scheduler).

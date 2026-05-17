---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Structured Concurrency

Concurrent tasks you spawn should be owned by the scope that spawned them — not floating free in a runtime waiting for you to manually track them down. Structured concurrency enforces this by tying task lifetimes to a lexical block: the block doesn't exit until all tasks inside it finish (or are cancelled), turning concurrency from a coordination problem into a scoping problem.

### The Core Mechanism

In unstructured concurrency — `go func()`, `asyncio.create_task()`, raw thread spawns — a child task is detached. It can outlive its creator, errors it raises vanish unless you explicitly wire up channels or callbacks, and cancellation requires manual propagation. You end up writing the same boilerplate on every callsite: WaitGroups, error accumulators, context threading.

Structured concurrency introduces a **nursery** or **task group** — a scope that owns its children. The invariant is strict: children cannot outlive the scope. When the scope exits normally, it blocks until all children complete. If any child errors, the scope cancels remaining children and re-raises. This isn't a convention; the runtime enforces it.

```python
# Python 3.11+ TaskGroup
async with asyncio.TaskGroup() as tg:
    user_task = tg.create_task(fetch_user(id))
    perms_task = tg.create_task(fetch_permissions(id))
# Both done here, or both cancelled if either raised
```

If `fetch_permissions` throws, Python cancels `fetch_user` and propagates the exception out of the `async with` block. No manual cleanup. No silent goroutine leak.

### Practical Scenarios

**Backend — fan-out request handlers:** You're handling an HTTP request that needs data from three downstream services. With unstructured concurrency you're coordinating WaitGroups, error channels, and context cancellation by hand. With a task group, you get all three for free — and critically, if the client disconnects and the parent context cancels, the scope propagates that cancellation to all children automatically. No more goroutines doing work for dead requests.

**Fullstack — streaming responses:** A server-sent events handler spawns tasks to tail a DB cursor, a pub/sub subscription, and a heartbeat ticker. If the SSE connection drops, the parent scope exits and tears down all three. Without structured concurrency, each task needs its own cancellation logic; with it, the scope is the cancellation boundary.

### Where It Breaks Down

Structured concurrency assumes tasks are finite. Background workers, infinite loops, or tasks that intentionally outlive their caller don't fit this model — those belong at a higher scope (e.g., the application lifecycle). Mixing the two patterns is where people get confused.

Language support: Python's `TaskGroup`, Kotlin's coroutine scopes, Swift's `withTaskGroup`, Java 21's `StructuredTaskScope`. Go's `errgroup` approximates it but doesn't enforce the lifetime guarantee at the type level.

The shift is conceptual: stop thinking of spawned tasks as messages you fire and forget, and start thinking of them as stack frames you own.

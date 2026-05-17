---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Green Threads and Coroutines

Green threads and coroutines are user-space threads: concurrent execution units managed entirely by your runtime or application code, invisible to the OS. The payoff is scale — where OS threads cost ~1MB of stack and a kernel context switch, a green thread might cost 4–8KB and switch in nanoseconds, letting you run millions concurrently on modest hardware.

### The Core Mechanism

OS threads are preemptive: the kernel interrupts execution on a timer and swaps the CPU to another thread, saving and restoring full register state. Green threads are cooperative (or M:N scheduled): a small runtime multiplexes many green threads onto a handful of OS threads. The key insight is that most I/O-bound work isn't actually using the CPU — it's blocked waiting for a network response or disk read. Green thread runtimes exploit this by detecting when a green thread would block, parking it, and immediately running another green thread on the same OS thread.

The mechanism looks like this: your green thread calls `read()` on a socket. The runtime intercepts the call, registers the fd with an event loop (epoll/kqueue), suspends your coroutine by saving its stack pointer and local variables, and switches to another ready coroutine. When the kernel signals the fd is readable, the runtime resumes your coroutine from where it left off — your code never knew it was suspended.

Coroutines are the building block: functions that can yield control and be resumed. Green threads add scheduling on top — automatic preemption at yield points (often I/O) without requiring explicit `yield` calls everywhere.

### Mental Model

Think of a single barista serving many customers. Instead of blocking everyone while the espresso machine runs, the barista starts your order, moves to the next customer, and comes back when the machine beeps. The "machine beeps" is your I/O completing. One barista (OS thread), many customers (green threads) — throughput is dictated by coffee machine wait times, not by hiring more baristas.

### Practical Backend Patterns

This is why Go can handle 100k concurrent HTTP connections with modest RAM — each goroutine starts at 2KB and grows as needed. It's also the model behind Python's `asyncio`, Node.js's event loop, and Erlang's processes.

Where you'll reach for this: connection-heavy services (websocket servers, proxies, chat), fan-out I/O (making 50 upstream API calls per request), or anywhere your thread count is limited by memory rather than actual CPU work.

**Watch for these pitfalls:**
- **Blocking the OS thread**: calling a CPU-bound or non-async-aware blocking function parks *all* green threads on that OS thread. Go detects this and spins up new OS threads; Python/Node don't — you'll block the event loop.
- **Stack overflows**: coroutine stacks are small by default. Deep recursion without growth detection will corrupt memory silently.
- **Cooperative starvation**: in purely cooperative schedulers, a tight CPU loop with no yield points starves other coroutines. Always yield at natural I/O boundaries.

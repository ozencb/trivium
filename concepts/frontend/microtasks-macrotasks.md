---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Microtasks vs Macrotasks

The JavaScript event loop doesn't treat all async callbacks equally — it runs an entire category of callbacks (microtasks) to completion before touching the next scheduled unit of work (macrotask). This two-tier queue is why `Promise.then` and `setTimeout(() => {}, 0)` don't interleave the way intuition suggests.

**The mechanism**

The event loop processes one macrotask per iteration — a script execution, a `setTimeout` callback, a `setInterval` tick, an I/O event. After each macrotask completes, before the next macrotask is dequeued, the engine drains the entire microtask queue. Every `.then`, `.catch`, `.finally`, `queueMicrotask()`, and `MutationObserver` callback is a microtask. Crucially, if processing a microtask enqueues another microtask, *that* runs before any macrotask. The microtask queue must reach empty before the loop moves on.

**Concrete model**

Think of it as a main counter with a side queue that must hit zero before the next customer is served. The macrotask is the customer; the microtasks are the receipts, confirmations, and follow-ups generated while serving them — all handled before the next customer steps forward.

```js
console.log('start');

setTimeout(() => console.log('setTimeout'), 0);

Promise.resolve()
  .then(() => console.log('p1'))
  .then(() => console.log('p2'));

console.log('end');
// Output: start → end → p1 → p2 → setTimeout
```

`p1` and `p2` both run before `setTimeout` despite the zero delay, because the microtask queue drains fully between macrotasks.

**Frontend implications**

React's `setState` batching (pre-React 18) and DOM `MutationObserver` callbacks are microtasks. If you chain multiple promise resolutions before yielding to the browser's render cycle (which happens between macrotasks), you can do a burst of state mutations without intermediate repaints — intentional and performant. But it also means a runaway microtask chain (promises chaining infinitely) will starve the render loop and freeze the UI, since the browser never gets to its next macrotask.

**Fullstack / Node.js implications**

Node has the same two-tier model, plus a third tier: `process.nextTick` callbacks drain *before* the native Promise microtask queue, making it even higher priority. When you're debugging why an I/O callback fires later than expected relative to a `.then` chain, you're almost always looking at this ordering. It matters for stream handling, database query callbacks, and any place you mix `util.promisify`-wrapped functions with legacy callback APIs.

**The invariant to internalize**

Microtasks see the world in a consistent state — no I/O, no timers, no renders interrupt them mid-queue. Macrotasks don't have that guarantee. Anything you need to happen atomically relative to the current call stack should be scheduled as a microtask; anything that can tolerate being deferred past I/O or rendering belongs in a macrotask.

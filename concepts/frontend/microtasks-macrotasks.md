---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Microtasks vs Macrotasks

JavaScript's event loop doesn't treat all async callbacks equally — it maintains two separate queues with different priority, and the order they drain determines the execution sequence you observe in your code.

### The Core Mechanism

The event loop works like this: pick one **macrotask**, run it to completion, then drain the **entire microtask queue** before touching the next macrotask. Not one microtask — all of them, including any microtasks spawned by microtasks.

**Macrotasks** (also called "tasks"): `setTimeout`, `setInterval`, `setImmediate` (Node), I/O callbacks, UI rendering events.

**Microtasks**: Promise callbacks (`.then`/`.catch`/`.finally`), `queueMicrotask()`, `MutationObserver`, `process.nextTick` (Node, technically its own queue but conceptually similar).

### Concrete Example

```js
console.log('start');

setTimeout(() => console.log('macro'), 0);

Promise.resolve().then(() => console.log('micro'));

console.log('end');
```

Output: `start → end → micro → macro`

Even though both the `setTimeout` and the Promise are "already resolved" by the time the synchronous code finishes, the microtask queue drains first. The 0ms delay on `setTimeout` doesn't matter — macro always yields to micros.

### Why It Matters in Practice

**Frontend:** You've probably written code that assumes a DOM update has settled before running follow-up logic. `MutationObserver` callbacks are microtasks, so they fire before the browser gets a chance to repaint (which is a macrotask). If you need to batch DOM reads after several mutations, you're already depending on this behavior. It also explains why `await`-ing a resolved Promise still lets other microtasks ahead of a `setTimeout` — `async/await` desugars to Promise chains, which are microtasks.

**Fullstack (Node.js):** In high-throughput servers, if you recursively queue microtasks (e.g., a `.then` that returns another Promise that schedules another `.then`...), you can starve I/O callbacks, which are macrotasks. This is a real production footgun — an infinite microtask chain blocks all I/O until it unwinds. Node's `setImmediate` exists partly to explicitly defer work to the macrotask queue and let I/O events breathe.

### Mental Model

Think of the event loop as a chef. Each order (macrotask) gets cooked one at a time. But every order comes with a "while you're at it" sticky note (microtask). The chef finishes all the sticky notes from the current order before pulling the next ticket — even if new sticky notes appear while reading the originals.

The practical upshot: microtasks are the right tool for work that must happen "immediately after this, but before anything else gets scheduled." Macrotasks are for genuinely deferring work to a future loop iteration.

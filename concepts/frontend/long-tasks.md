---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Long Tasks API

The Long Tasks API surfaces any task running on the main thread for more than 50ms—the threshold where users start perceiving lag. It exists because the browser's main thread is single-threaded: while JavaScript is executing, it can't respond to input events, and that gap between input and response is exactly what degrades perceived performance.

### The mechanism

The browser exposes this through `PerformanceObserver` with the `"longtasks"` entry type. Each entry gives you the task's duration, start time, and an `attribution` array pointing to the frame or script that triggered it.

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long task:', entry.duration, entry.attribution);
  }
});
observer.observe({ type: 'longtasks', buffered: true });
```

The `attribution` is where it gets useful—it tells you *where* the task originated (which iframe, script URL, or document) rather than just that something was slow.

### The mental model

Think of the main thread as a single cashier at a grocery store. A long task is someone paying with exact change from the bottom of their bag for 3 minutes. The person behind them presses a button (clicks a UI element), but nothing happens until that transaction finishes. The Long Tasks API tells you exactly when that 3-minute transaction happened and approximately who caused it.

The 50ms cutoff maps to the RAIL model's interaction budget: a response should begin within 100ms of input, and if you're spending 50ms+ on a task, you've probably eaten that budget.

### Where you'll actually use this

**Frontend:** The most common culprit is synchronous work kicked off by a user interaction—event handlers that do heavy DOM operations, third-party scripts that parse large JSON on load, or React reconciliation triggered by a state update that rerenders too much. You'll see a spike in longtask entries right as your INP (Interaction to Next Paint) metric degrades. This is the API that tells you *which* work to break up with `setTimeout` yielding or move to a Web Worker.

**Fullstack:** When a page hydrates after SSR, the hydration process itself often registers as a long task—especially in apps with large component trees or complex initial state. If you're seeing high TTI (Time to Interactive) on your server-rendered pages, longtask data helps you pinpoint whether it's hydration, data parsing, or a third-party tag loading synchronously.

### What it doesn't tell you

It flags that *something* ran long, but the attribution is coarse. You'll usually need to pair it with a profiler trace or `performance.measure()` calls to narrow down the specific function. It's a signal, not a diagnosis—treat it as the alarm, then use DevTools' Performance panel as the investigation.

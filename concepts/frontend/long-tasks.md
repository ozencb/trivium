---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

The Long Tasks API lets you detect when the browser's main thread is blocked for 50ms or longer — the threshold where user interactions start feeling unresponsive.

## Core Mechanism

The browser runs JavaScript, style recalculation, layout, and paint on a single main thread. When any continuous chunk of work holds that thread for >50ms, input events queue up behind it. A user clicking a button during a 200ms JS task waits the full duration before their click is even acknowledged — that's the source of "jank."

The Long Tasks API (part of PerformanceObserver) surfaces these blocking periods as `PerformanceLongTaskTiming` entries. Each entry gives you the duration and an `attribution` array pointing to which browsing context (frame, script, etc.) caused it.

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long task:', entry.duration, entry.attribution);
  }
});
observer.observe({ type: 'longtask', buffered: true });
```

The `buffered: true` flag captures tasks that already ran before your observer was registered — important if you're measuring page load.

## Mental Model

Think of the main thread as a single-lane road. Long tasks are trucks that block all traffic behind them. The Long Tasks API is a traffic camera that logs every truck that takes more than 50ms to clear the intersection. It doesn't fix the congestion — it tells you *where* and *when* it's happening.

## Practical Scenarios

**Frontend:** You're investigating why your React app scores poorly on INP (Interaction to Next Paint). Long Tasks API in a RUM (real user monitoring) setup lets you correlate task durations with specific user flows — e.g., "the filter dropdown causes a 180ms task on every interaction." Without it, you're guessing from DevTools profiles taken in controlled conditions, not real user sessions.

**Fullstack:** You're building a Next.js app with heavy client-side data processing after SSR hydration. Long Tasks API lets you measure whether your hydration phase is crossing 50ms thresholds on low-end devices. You can send these metrics to your observability backend alongside server-side traces, creating a complete picture from server response to interactive UI.

## What It Doesn't Tell You

Long Tasks API gives you timing and rough attribution, not a stack trace. You'll know *that* a script caused a long task, not *which function* within it. That's where profiling with DevTools or combining this with User Timing API marks (`performance.mark`) fills the gap.

This API is the detection layer — `requestIdleCallback` and task scheduling (breaking work into chunks) are the remediation layer once you know what to fix.

---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

`requestAnimationFrame` (rAF) is the browser's mechanism for scheduling visual updates in sync with the display's refresh cycle — use it instead of `setTimeout`/`setInterval` when you want smooth, efficient animation.

## The Core Mechanism

The browser paints frames at a fixed rate (typically 60fps, so ~16.67ms per frame). `setTimeout(fn, 16)` *approximates* this but drifts: timers fire based on the JS event loop, not the display hardware. Your update might land mid-frame, causing the browser to hold it until the next paint anyway — or worse, cause tearing if you're pushing DOM changes out of sync with the rendering pipeline.

rAF ties your callback to the browser's actual render loop. It fires *before* the browser paints the next frame, in the "update rendering" step — after layout thrashing from JS, but before Style/Layout/Paint/Composite. This gives you exactly one slot per frame to make changes that will be visible in that frame.

The callback receives a `DOMHighResTimeStamp` — the timestamp of the frame, not the time your callback was invoked. This is subtle but important: multiple rAF callbacks in the same frame get the *same* timestamp, letting you synchronize animations precisely.

```js
function animate(timestamp) {
  const progress = (timestamp - startTime) / duration;
  element.style.transform = `translateX(${progress * 300}px)`;
  
  if (progress < 1) requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

Notice the recursive call — rAF is one-shot by design. You opt into each frame explicitly. This also means cancellation (`cancelAnimationFrame`) is clean and composable.

## Mental Model

Think of it as subscribing to a "pre-paint" event that fires at the display's heartbeat. You're not setting a timer; you're saying "before the browser draws the next frame, run this first."

## Practical Scenarios

**Frontend:** Any time you're animating with JS — scroll-linked effects, canvas drawing loops, custom physics, parallax. Anything `requestAnimationFrame`-driven will automatically pause when the tab is hidden (browsers throttle or stop rAF in background tabs), saving battery and CPU without extra logic.

**Fullstack:** Less obvious but relevant when building dashboards or data-viz. If you're pushing WebSocket updates to a chart and naively re-rendering on every message, you'll paint 10× per frame during bursts. Batching updates with rAF — accumulate data changes, render once per frame — eliminates jank and reduces layout thrash significantly.

## Where This Leads

rAF is the execution model underlying the Web Animations API (WAAPI), which abstracts the loop away entirely. Understanding rAF explains *why* WAAPI animations can be offloaded to the compositor thread — they're declared as frame-based intent, not imperative per-frame mutations.

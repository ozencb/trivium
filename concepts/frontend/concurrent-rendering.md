---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Concurrent Rendering

React can now pause, discard, and reprioritize in-progress renders instead of executing them as a single uninterruptible synchronous block — which means expensive renders no longer freeze the UI.

### The Core Mechanism

React Fiber already broke rendering into a tree of small units of work. Concurrent rendering makes that work **interruptible**. Before each fiber unit is processed, React can yield back to the browser's event loop, check whether higher-priority work has arrived (e.g., a keypress), and decide: continue the current render, or throw it away and start fresh with the new state.

This is the critical shift: in legacy sync mode, once `setState` triggers a render, React owns the thread until the commit phase finishes. Nothing else runs — not animations, not input handlers, nothing. Concurrent mode treats the work-in-progress tree as **speculative and disposable**. React maintains the current committed tree (what's on screen) separately, so a half-finished render can be abandoned without corrupting the UI.

### Mental Model

Imagine two whiteboards. React draws the updated UI on the second board while the user is still looking at the first. If the requirements change mid-draw, React can erase the second board and start over — the user never sees the mess because the first board hasn't changed. In sync mode, there's only one board and React erases and redraws it live.

### Practical Scenarios

**Frontend:** A search-as-you-type input. Every keystroke triggers a filter over thousands of items. In sync mode, each keystroke causes a blocking render — the input feels sluggish. With concurrent rendering, you mark the results update as a low-priority transition (`startTransition`). React keeps the input responsive by interrupting the results render whenever a new keystroke arrives, only committing when the user pauses.

**Fullstack:** Streaming SSR + Suspense. The server starts sending HTML before all data is ready, wrapping pending sections in Suspense boundaries. The client receives and hydrates chunks progressively. Concurrent rendering is what makes selective hydration work — React can hydrate high-priority parts of the page (say, the nav the user just clicked) before lower-priority off-screen sections, rather than hydrating the whole tree left to right.

### Why This Unlocks Suspense and Transitions

**Suspense Boundaries** become genuinely useful for data fetching only under concurrent rendering. When a component suspends (throws a Promise), React can pause that subtree, show the nearest fallback, and continue rendering the rest of the tree — possible only because renders are interruptible and partial commits are fine.

**React Transitions API** is the explicit surface for controlling this. `startTransition` is you telling React: "this state update is non-urgent — feel free to interrupt it." Without concurrent rendering underneath, that hint would be meaningless.

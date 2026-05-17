---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

React Fiber is React's from-scratch rewrite of its reconciliation engine, shipped in React 16. The core problem it solved: the old "stack reconciler" walked the entire component tree synchronously, meaning a large render could block the main thread for hundreds of milliseconds and make the UI feel frozen.

**The core mechanism**

Fiber turns the component tree into a linked list of "fiber nodes" — one per component instance. Each node tracks the component type, its props/state, its effect list, and crucially, pointers to its parent, child, and sibling. This structure lets React pause in the middle of a tree walk, store exactly where it stopped, and resume later.

Work happens in two phases:
1. **Render phase** (interruptible): React builds a "work-in-progress" tree by cloning and diffing fiber nodes. This can be paused, thrown away, or restarted. Side effects don't run here.
2. **Commit phase** (synchronous): Once the full work-in-progress tree is ready, React flushes all DOM mutations and effects in one uninterrupted pass. This phase cannot be paused — partial commits would leave the UI inconsistent.

The scheduler assigns each unit of work a *lane* (a priority bitmask). User input is high-priority; background data fetching is low. React can interrupt low-priority work when something urgent arrives, completing the urgent work first before resuming.

**Mental model**

Think of the old reconciler as a recursive depth-first function call — you can't pause a call stack mid-flight. Fiber replaces that with an explicit loop over a work queue. React controls the loop, so it can yield back to the browser between iterations: "I've done 5ms of work, let me check if there's user input before continuing."

**Where this surfaces in practice**

*Frontend*: `useTransition` and `useDeferredValue` are direct expressions of Fiber's priority system. Wrapping a state update in `startTransition` tells React "this can yield to more urgent renders." Without Fiber, this API literally couldn't exist. If you've ever wrapped a search input update in `startTransition` to keep keystrokes responsive while filtering a large list, you're exploiting Fiber's scheduling.

*Fullstack (Next.js, RSC)*: React Server Components stream chunks of UI progressively. Fiber's commit phase is what makes it safe to receive and "hydrate" partial trees — React can hold a subtree in the work-in-progress phase until its data arrives (via Suspense), then commit it atomically. This is why Suspense boundaries act as the unit of "what can stream independently."

**The key invariant to internalize**: the render phase may run multiple times for the same update (it can be discarded and restarted), but the commit phase runs exactly once per completed render. This is why effects and mutations belong in the commit phase — and why effect cleanup matters more than most people think.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Concurrent Rendering

Concurrent rendering lets React treat its render work as interruptible rather than synchronous and blocking. The motivation is straightforward: a slow render (large list, complex tree) previously locked the main thread until it finished — concurrent mode breaks that guarantee to keep the UI responsive.

**The core mechanism**

You already know Fiber represents the render tree as a linked list of units of work. Concurrent rendering layers a *scheduler* and a *lane-based priority system* on top of that. Each update is tagged with a priority lane — user input lands in a sync/high-priority lane, a transition or deferred update in a lower one.

During rendering, React works through fibers incrementally. Between units of work, the scheduler checks: *is there higher-priority work pending?* If yes, React abandons the current in-progress work-in-progress tree and starts fresh on the urgent update. This is safe because React never mutates the *current* tree until the commit phase — the work-in-progress tree is disposable.

This is cooperative multitasking, not preemptive. React voluntarily yields to the event loop (via `MessageChannel` / `postMessage`) rather than being forcibly interrupted. The invariant is: the *current* (committed) tree is always consistent and visible; the in-progress tree can be thrown away at any point.

**Mental model**

Think of it as React checking its inbox between each task. If a high-priority message (keypress, click) arrives while it's processing a low-priority re-render, it sets the work-in-progress aside and handles the urgent message first. The expensive render restarts from scratch afterward — it doesn't resume mid-tree.

**Frontend**

This is why wrapping a heavy state update in `startTransition` actually works: you're explicitly telling React "this update is low-priority; if something urgent comes in, preempt it." Without this, typing in an input field while filtering a 10k-row list would stutter because both updates competed in the same sync lane.

**Fullstack**

Server components stream their payload in chunks; concurrent rendering lets the client progressively render those chunks as they arrive without blocking interaction. A suspending boundary in a streamed page doesn't freeze the shell — React keeps the committed tree visible while work-in-progress resolves.

**The practical implication**

Your components must be *pure* during render. Because React may render a component multiple times before committing (abandoned work-in-progress trees), side effects in the render path will fire unpredictably. This is the real-world invariant concurrent mode enforces that strict mode surfaces in development.

Understanding this makes Suspense and the Transitions API readable as deliberate priority controls over the scheduler, rather than magic.

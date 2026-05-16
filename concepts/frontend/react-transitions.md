---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## React Transitions API

React Transitions lets you classify state updates by urgency — marking some as "can wait" so React can keep the UI responsive while heavier renders happen in the background. The problem it solves: before this API, all state updates competed equally for the render pipeline, so a slow re-render would block fast interactions like keystrokes.

### Core mechanism

The API sits on top of Concurrent Rendering's ability to maintain multiple in-progress render trees. When you wrap a state update in `startTransition`, React splits work into two lanes:

1. **Urgent**: applied immediately, keeps the current committed UI intact
2. **Transition**: rendered in the background, interruptible

The critical behavior is **interruption**. If a new urgent update arrives while a transition is mid-render, React discards the in-progress work and starts over. This is why transitions feel "free" — they don't block anything, and stale renders get thrown away automatically.

```js
const [isPending, startTransition] = useTransition();

// input update: urgent (user sees their keystroke immediately)
setInputValue(e.target.value);

// filter update: transition (can be deferred, can be interrupted)
startTransition(() => {
  setQuery(e.target.value);
});
```

`isPending` goes `true` while the transition render is in-flight, giving you a hook to show a subtle loading state without a full skeleton.

### Mental model

Imagine two queues at a deli counter. Urgent updates jump to the front. Transitions wait in the regular line — and if they're still waiting when something urgent arrives, they lose their spot and have to re-queue with the new data. You never serve stale work.

### Practical scenarios

**Frontend — search/filter UIs:** The canonical case. A controlled input + a large filtered list. Mark the list re-render as a transition. The input stays crisp at 60fps; the list catches up when React has spare time. Without this, even a 100ms render noticeably lags keystrokes.

**Frontend — tab/view switching:** User clicks a tab that renders a complex chart or table. Wrap the "active tab" state update in `startTransition`. The tab highlights immediately (urgent), the content renders without blocking interaction. `isPending` lets you dim or overlay the panel while it loads.

**Fullstack — route transitions with Suspense:** In Next.js App Router or React Router with `startTransition`-wrapped navigation, React keeps the current route visible while the new route's data fetches and renders in the background. This is why Next.js wraps `router.push` in a transition internally — it avoids flashing to a loading skeleton on every navigation when the new page is fast enough to render before the user notices.

The practical rule: any update that's triggered by user input but drives a render that isn't the direct acknowledgment of that input is a transition candidate.

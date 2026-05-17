---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## React Transitions API

`useTransition` and `startTransition` let you mark a state update as "deferrable" — React will start rendering it but yield to more urgent work (like keystrokes or clicks) if they arrive mid-render. Without this, a single expensive state update blocks the main thread until it finishes, causing visible input lag.

### The core mechanism

React's concurrent renderer can pause, abandon, and restart renders. But it needs to know *which* renders are worth interrupting. By default, everything is treated as equally urgent. `startTransition` is your signal: "this update matters, but not more than user input."

```js
const [isPending, startTransition] = useTransition();

function handleSearch(query) {
  setInputValue(query);                    // urgent — updates the input immediately
  startTransition(() => {
    setFilteredResults(heavyFilter(query)); // deferred — can be interrupted
  });
}
```

The input stays responsive while the filtered list renders in the background. If the user types again before the list finishes, React throws away the in-progress render and starts fresh with the latest value. `isPending` gives you a signal to show a loading indicator without committing to a spinner lifecycle.

### What's actually happening

React doesn't move work to a worker thread — it's still single-threaded. What changes is the *priority lane*. Transition updates render at a lower priority lane. When higher-priority work arrives, React saves its progress, handles the urgent update, then resumes (or discards and restarts) the deferred work.

### When to reach for it

**Frontend:** Route transitions with heavy component trees, search-as-you-type with expensive filtering/sorting, tab switches that unmount/remount large subtrees. If you've ever added a debounce to "fix" lag, transitions are often the right fix instead — debounce hides the problem, transitions let React *interrupt* it.

**Fullstack:** Combined with Suspense and server components, transitions are how Next.js App Router keeps navigation snappy. When you navigate, React starts rendering the new route in the background (transition) while keeping the current page interactive until the new one's ready.

### Common pitfalls

- **Wrapping the wrong update**: Both state updates in the example above need to exist — the input value *outside* the transition (urgent), the expensive result *inside*. Wrap too much and the input feels sticky.
- **Expecting immediate commits**: Transition updates don't flush synchronously in tests. Use `act` with async or `waitFor`.
- **Using it for async work**: `startTransition`'s callback must be synchronous. For async data fetching, pair it with Suspense — the transition keeps things smooth while Suspense handles the pending state.

Reach for this when you have a render that's legitimately expensive and user-triggered, and you'd rather React deprioritize it than block input.

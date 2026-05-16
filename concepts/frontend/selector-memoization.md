---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Selector Memoization

A selector is a function that derives data from your store state — filtering a list, computing a total, denormalizing a normalized shape. Memoization caches the result and skips recomputation when inputs haven't changed, but the real payoff isn't performance: it's **referential stability**.

### The core problem

In a Flux-derived architecture (Redux, Zustand, etc.), components subscribe to state and re-render when it changes. If your selector returns a new object or array on every call — even with identical data — React's shallow equality check sees a new reference and re-renders anyway.

```js
// This always returns a new array, even if nothing relevant changed
const getActiveUsers = (state) => state.users.filter(u => u.active);
```

Every unrelated state update (a modal opening, a counter incrementing) triggers a re-render in any component using this selector.

### The mechanism

Libraries like Reselect solve this with a two-level check:

1. **Input selectors** extract raw slices from state using reference equality
2. **Result function** only runs if any input reference changed; otherwise returns the cached result

```js
const getActiveUsers = createSelector(
  (state) => state.users,       // input selector
  (users) => users.filter(u => u.active)  // result function
);
```

If `state.users` reference hasn't changed, you get back the exact same array instance as last time. Same reference → component skips re-render.

### Mental model

Think of it as a pure function with a one-slot cache: last-arguments → last-result. Reselect's default cache size is 1, so it only remembers the most recent call. This is fine for most cases but matters if you're calling the same selector with different arguments (e.g., parameterized selectors in a list).

### Where this bites you in practice

**Frontend:** You have a product grid with filtering, sorting, and pagination. Each of those operations produces a derived list. Without memoization, every keystroke in an unrelated search field re-renders the entire grid because the selector produces a new array. With memoization, only the filter/sort/page state changes trigger recomputation.

**Fullstack:** In SSR or BFF patterns, you often transform normalized API responses into view-ready shapes on the server. The same principle applies — memoizing these transforms at the request level (or within a request's execution context) avoids redundant work when multiple components need the same derived data during a single render pass.

### The subtlety to watch for

Memoization breaks when you call a parameterized selector from multiple component instances, because they all share one cache slot and thrash each other's cached results. The fix is either factory functions (each instance gets its own selector) or a library that supports per-instance caches.

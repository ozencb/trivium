---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Selector Memoization

In a Flux-derived store, your components often need *derived* state — filtered lists, aggregated totals, joined data across slices. Without memoization, every store update recomputes those derivations from scratch, even when the inputs haven't changed. Selector memoization caches the output keyed to its inputs, so the recomputation only happens when something it actually depends on changes.

### The core mechanism

A memoized selector wraps a pure function with a cache layer that tracks its last arguments. If called again with referentially equal inputs, it returns the cached result — same reference, zero work. The selector library (reselect being the canonical example) does this by composing *input selectors* (cheap, direct state reads) with a *result function* (the expensive transformation):

```js
const selectVisibleTodos = createSelector(
  state => state.todos,       // input selector
  state => state.filter,      // input selector
  (todos, filter) => todos.filter(t => t.status === filter)  // result function
);
```

If `state.user` or `state.theme` changes but `state.todos` and `state.filter` haven't, `selectVisibleTodos` returns the exact same array reference it returned last time. Components receiving that reference won't re-render.

The reference equality part matters more than it looks. React's `memo`, `useMemo`, and `shouldComponentUpdate` all rely on referential stability. If your selector recreates `[]` on every call even when the data is unchanged, you've silently broken all that downstream optimization.

### Where this bites you in practice

The most common failure mode: a selector that *looks* memoized but takes dynamic arguments.

```js
// This creates a new selector instance on every render
const selectByStatus = (status) => createSelector(
  state => state.todos,
  todos => todos.filter(t => t.status === status)
);
```

Every render constructs a fresh selector with a fresh cache — you get zero memoization benefit. The fix is either lifting the selector outside the component, using a factory pattern with per-instance selectors (`useMemo(() => createSelector(...), [])` in React), or using selector libraries that handle parametric selectors natively (reselect v5's `createSelectorCreator`, or RTK Query's `createSelector`).

### Practical relevance

**Frontend-heavy apps:** If you're aggregating or transforming store data into anything a component renders — sorted lists, derived totals, denormalized joins — memoized selectors are the right tool. They're also the natural seam for unit testing business logic separately from components.

**Fullstack with SSR:** On the server, you often reconstruct store state per-request. Selector memoization provides less benefit there (the cache is per-request lifetime), but it still pays off if a single render tree calls the same selector dozens of times — the first call computes, subsequent calls in the same render hit cache.

The rule of thumb: if a selector does more than a direct property lookup, memoize it. The cost is near zero; the benefit compounds across every re-render.

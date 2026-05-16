---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Signals-Based Reactivity

Signals are reactive primitives that wrap values and automatically track who reads them — so when a value changes, only the code that actually depends on it re-runs, not a broader component tree or diff cycle.

### The Core Mechanism

A signal has three parts working together:

1. **A signal** — a value wrapper with get/set. Reading it in a reactive context registers a subscription.
2. **A derived/computed value** — a function whose result recalculates when its signal dependencies change.
3. **An effect** — a side-effectful function that re-runs when its dependencies change.

The key insight is *automatic dependency tracking*. You don't declare `[count]` as a dependency list like React's `useEffect`. Instead, the runtime tracks which signals were *read* during execution and wires up subscriptions automatically. Change a signal, and only its direct subscribers re-execute — not their parents, not sibling branches.

```js
const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => console.log(doubled.get())); // runs when doubled changes

count.set(5); // logs 10 — only this effect ran
```

### Mental Model

Think of it like a spreadsheet. Cell A1 holds a value. Cell B1 has a formula `=A1*2`. You don't "subscribe" B1 to A1 — the spreadsheet engine tracks the dependency when the formula runs. Change A1, and B1 updates. Nothing else does.

React's model is more like: "something changed somewhere in this subtree, re-render the subtree and diff against the previous output." Signals skip the subtree entirely — they push updates directly to granular dependents.

### Why It Matters in Practice

**Frontend:** In frameworks like SolidJS, Vue 3, or Angular 16+, signals mean a deeply nested component can update a displayed value without triggering re-renders up the tree. A counter 10 levels deep updates its DOM node directly. This eliminates a major class of performance problems — no memoization, no `useMemo`/`useCallback` wrestling, no accidental re-renders.

**Fullstack:** Signals show up in reactive query patterns — think TanStack Query's reactive cache, or server-sent state updates that propagate only to the UI slices that actually care about a given resource. The same push-to-subscriber model applies: you're not re-fetching everything, you're updating a signal and letting the dependency graph do the rest.

### The Tradeoff to Know

Signals require a reactive runtime that intercepts reads. Code outside that runtime — plain functions, async boundaries, non-reactive contexts — breaks the subscription graph silently. This is the primary gotcha: reactivity is contagious and context-sensitive in ways that `useState` isn't.

Understanding this model is the foundation for grasping fine-grained reactivity — where entire rendering architectures are built around the granularity of these subscriptions.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Signals-Based Reactivity

A signal is a value container that automatically tracks which computations read it and re-runs only those computations when the value changes. Unlike coarser models (React's component re-render, for example), signals give you surgical updates — the dependency graph is built at runtime, not defined by you.

### The Core Mechanism

Three primitives compose the model:

1. **Signal** — a value with a read trap. When something reads the signal, it registers itself as a subscriber.
2. **Effect** — a computation that runs in a tracked context. Any signal read inside it creates a live dependency edge.
3. **Computed** — a derived value, itself a signal, lazily re-evaluated only when its upstream signals change.

The tracking is implicit. When you call `count()` inside an effect, the signal doesn't just return the value — it looks at the currently-executing context and adds it to a subscriber list. When `setCount(n)` fires, the signal walks that list and queues re-evaluation. This is why signals feel "magical": the subscription graph emerges from normal function calls.

### Mental Model

Think of a spreadsheet. Cell A1 holds a number. Cell B1 contains `=A1 * 2`. When A1 changes, the spreadsheet knows B1 is dirty because it recorded the dependency when B1's formula was first evaluated. Signals are exactly this — a programmable spreadsheet engine where the "cells" are arbitrary computations, not grid coordinates.

```js
const count = signal(0);
const doubled = computed(() => count() * 2); // reads count → subscribes
effect(() => console.log(doubled()));        // reads doubled → subscribes

count.set(5); // triggers doubled → triggers effect → logs 10
```

### Practical Scenarios

**Frontend:** Signals shine in fine-grained UIs — dashboards, live feeds, form validation. In React, toggling a boolean re-renders the entire component subtree unless you memo aggressively. With signals (Solid.js, Vue refs, Preact Signals, Angular's new signals API), only the DOM node bound to that specific signal updates. No virtual DOM diffing, no reconciliation overhead.

**Fullstack:** Signals appear in reactive query caches (TanStack Query's internal invalidation model shares the intuition), and in server-sent event pipelines where a derived value (e.g., "online user count") is computed from multiple upstream sources and needs to propagate changes downstream without polling.

### Common Pitfalls

- **Reading outside a tracked context** creates no subscription — the read is passive, silent, and you won't see updates.
- **Conditional reads** break the dependency graph. If `if (flag()) doSomething(signal())` never hits the `signal()` branch on first run, that dependency is never registered.
- **Over-computing** in effects — effects should be side effects, not derivations. Derived values belong in `computed()` so they're memoized and lazily evaluated.

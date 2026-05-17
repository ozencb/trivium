---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Fine-Grained Reactivity

Fine-grained reactivity takes signals to their logical conclusion: instead of re-running a component function when state changes, the runtime directly patches the specific DOM node — or derived value — that subscribed to that exact signal. There's no virtual DOM diffing, no component bailout heuristics, no reconciler to reason about.

### The Core Mechanism

In a coarse-grained system (React), a state change marks a component dirty and re-renders the whole subtree. Fine-grained systems invert this: when a signal's value changes, the runtime walks a dependency graph it built at subscription time and updates only the registered effects — which might be a single text node binding, a single CSS class, or a single attribute.

The graph is built automatically as signals are *read*. If your template reads `count()` inside a `<span>`, that span's text node gets registered as a subscriber. When `count` changes, only that text node updates. The function containing the template never re-runs.

### Mental Model

Think of it like a spreadsheet. Cells don't recompute the whole sheet when one value changes — they only recompute cells that have a formula referencing the changed cell. Fine-grained reactivity applies that model to DOM mutations. Each binding is a cell formula; each signal is a source cell.

### Concrete Example

```js
// Solid.js
function Counter() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count()}</button>;
}
```

The `Counter` function runs *once*. After that, `count()` changing triggers a direct text node update — no function call, no diffing. Compare this to React where the whole function re-executes on every click.

### Practical Scenarios

**Frontend:** This matters most when you have high-frequency updates — animation frames, real-time data feeds, collaborative cursors, live form validation. With React you'd reach for `useMemo`, `useCallback`, `React.memo`, and `startTransition` to avoid re-render cascades. With fine-grained reactivity, those aren't the default concern. The pitfall is that effects *are* subscriptions, so accidentally reading a signal inside an untracked scope means you don't get updates; conversely, reading too many signals in one effect creates over-broad dependencies.

**Fullstack:** Frameworks like SolidStart and Qwik use fine-grained reactivity to push the subscription graph to the edge — serializing which signals a client needs and resuming them without re-running component logic (Qwik's resumability). This makes hydration nearly free. The tradeoff is that the mental model diverges from React's "just re-render and trust the diff," so teams already deep in Next.js/React Server Components don't always get a clean migration path.

### When to Reach For It

If your bottleneck is unnecessary re-renders and you're already compensating with memoization, fine-grained reactivity eliminates the problem at the model level rather than patching around it. It's not universally better — the dependency graph adds overhead for static UIs — but for interactive, data-dense interfaces it's a meaningful architectural win.

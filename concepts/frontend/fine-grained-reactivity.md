---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Fine-Grained Reactivity

Fine-grained reactivity is a rendering model where updates propagate **only to the exact DOM nodes or computations that depend on changed state** — no component re-renders, no diffing, no vdom. It's what makes signals-based frameworks like Solid, Vue's composition API internals, and Svelte 5 feel fundamentally different from React.

### The Core Mechanism

In a coarse-grained system (React), a state change triggers a function call (the component), which produces a new description of UI, which gets diffed against the old one. The unit of update is the component.

In fine-grained reactivity, the dependency graph is built at the **expression level**. When you read a signal inside a reactive context, the runtime records: "this computation depends on this signal." When the signal changes, only those specific computations re-run — not the surrounding function, not the parent, nothing else.

The runtime maintains a live dependency graph. Computations (effects, derived values, DOM bindings) are nodes. Signals are sources. An edge is created on read, torn down and rebuilt on re-evaluation. This is why it's "fine-grained" — the granularity is an individual read, not a component boundary.

### Concrete Example

```js
const [count, setCount] = createSignal(0);
const [name, setName] = createSignal("Alice");

// Only this text node updates when count changes
<span>{count()}</span>

// Only this text node updates when name changes  
<h1>{name()}</h1>
```

In React, changing `count` re-renders the whole component, producing a new vdom tree, and the diffing algorithm figures out only the `<span>` changed. In a fine-grained system, changing `count` directly updates the text node bound to `count()`. The `<h1>` is never touched — not re-evaluated, not diffed.

### Practical Implications

**Frontend:** You can have a 10,000-row table where editing a cell only updates that cell's DOM node. No keys, no memoization, no `shouldComponentUpdate`. The reactivity system handles surgical updates structurally, so you don't pay for abstractions you don't need.

**Fullstack:** When server components push state to the client (e.g., via websockets or SSE), fine-grained reactivity means you can stream partial updates and have them land precisely in the right DOM locations without a full re-render cycle. This matters for real-time UIs — dashboards, collaborative editors, live feeds — where coarse re-rendering creates visible jank or requires complex optimization.

### The Tradeoff

The dependency graph has overhead — tracking reads and writes costs memory and setup time. For mostly-static UIs, this overhead can exceed the savings. Fine-grained reactivity pays off when updates are frequent, localized, and the component tree is deep or wide enough that coarse re-rendering becomes expensive.

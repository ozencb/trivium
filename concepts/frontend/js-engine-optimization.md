---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## JavaScript Engine Optimization

Modern JS engines don't just interpret your code line-by-line — they profile it at runtime and compile hot paths down to near-native machine code. Understanding how they decide what to optimize (and what causes them to give up) is how you write JS that's actually fast.

### The core mechanism: speculative compilation

V8 (Chrome/Node) runs code in two stages. First, the Ignition interpreter executes quickly but produces no optimized code. As it runs, it collects *type feedback* — what types flow through each variable, what shapes objects have. When a function runs enough times, TurboFan (the optimizing compiler) takes over using that feedback to speculate: "this function always receives a number, so I'll compile it assuming that."

The catch: if the speculation is ever wrong, V8 *deoptimizes* — throws away the compiled code and falls back to the interpreter. This is cheap occasionally, but if it happens in a tight loop, you're paying the cost over and over.

### Hidden classes: the property order trap

V8 assigns each object a "hidden class" based on its shape — which properties it has, in which order they were added. Objects with identical shapes share a hidden class and get fast O(1) property access through inline caches.

```js
// Both objects get the same hidden class — fast
function Point(x, y) { this.x = x; this.y = y; }

// These two get different hidden classes — slower
const a = {}; a.x = 1; a.y = 2;
const b = {}; b.y = 2; b.x = 1; // different insertion order
```

`delete obj.prop` is similarly toxic — it forces a shape transition and often makes the object "dictionary mode," which disables inline caches entirely.

### Monomorphic vs. megamorphic call sites

A function that always receives the same argument types is *monomorphic* — fully optimizable. Once 5+ different shapes flow through a call site, V8 marks it *megamorphic* and stops trying. This matters when you write generic utility functions that get called with wildly varying object shapes.

### Practical implications

**Frontend:** React's reconciler benefits from consistent component prop shapes. Passing `undefined` for optional props vs. omitting them creates different hidden classes — at scale, this can affect performance in large lists.

**Fullstack (Node):** Hot request handlers should avoid constructing objects with variable property sets. Parsing different JSON shapes through the same handler repeatedly will hit megamorphic state. Normalizing incoming data into consistent shapes before processing it keeps V8 happy.

The heuristic to internalize: *consistency beats cleverness*. Consistent types, consistent object shapes, homogeneous arrays. The engine rewards predictability with aggressive optimization; dynamic, flexible code pays a runtime tax.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## JavaScript Engine Optimization

JavaScript engines like V8 don't interpret your code line-by-line at runtime — they compile it to machine code on the fly, speculating that your objects will keep the same shape and your call sites will keep seeing the same types. When those bets pay off, you get near-native speed; when they don't, the engine silently throws away its compiled code and falls back to slower execution.

**The core mechanism: hidden classes and inline caches**

V8 internally assigns every object a *hidden class* — a compact description of its property layout (names, offsets, types). When you do `obj.x`, V8 doesn't look up `"x"` in a hash map at runtime. Instead, it JIT-compiles a specialized version of that access: "this object's hidden class is C12, and `x` is always at byte offset 8, so just load from there." That compiled stub is the *inline cache*.

This works because hidden classes are stable — they're preserved as long as you don't change the object's shape. Two objects created with `{ x: 0, y: 0 }` share the same hidden class. The moment you add a property in a different order (`{ y: 0, x: 0 }`) or tack one on later (`obj.z = 5`), V8 creates a new hidden class and may invalidate cached machine code.

**The polymorphism tax**

A call site or property access becomes *monomorphic* (one hidden class seen), *polymorphic* (2–4 classes seen), or *megamorphic* (5+ classes). Monomorphic sites compile to a direct memory load. Polymorphic sites compile to a small switch. Megamorphic sites abandon the cache entirely and fall back to the generic lookup — the slow path. The engine doesn't warn you; it just gets slower.

**Concrete mental model**

Think of hidden classes like TypeScript interfaces, but enforced at the property-insertion level. If you always build objects through a constructor or object literal with a fixed shape, V8 creates one hidden class and reuses it everywhere. If you conditionally add properties, you're forking the hidden-class tree and fragmenting your caches.

**In practice**

*Frontend:* React's reconciler creates many component state objects. If you spread different shapes into `useState` or mutate objects by adding properties conditionally, you can fragment hidden classes across a hot render path — cumulative microsecond penalties that show up as jank at 60fps.

*Fullstack (Node.js):* Request handler objects that get properties attached based on middleware conditions are a classic megamorphic trap. A logging middleware that sometimes adds `req.traceId`, sometimes `req.correlationId`, produces objects V8 can't specialize for. High-throughput routes feel the cost most.

The fix in both cases is the same: define object shapes upfront, add all properties in consistent order, and avoid ad-hoc property attachment after construction.

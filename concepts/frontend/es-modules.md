---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## ES Modules

ES Modules (ESM) is JavaScript's native, standardized module system — the mechanism by which files declare what they export and what they depend on. It replaced a fragmented ecosystem of CommonJS, AMD, and UMD by making modules a first-class language feature rather than a runtime convention.

**The core idea: static structure**

The critical distinction between ESM and predecessors like CommonJS isn't syntax — it's *when* dependencies are resolved. In CommonJS, `require()` is a function call that runs at runtime, which means it can live inside conditionals, loops, or functions. The module graph isn't knowable until the code executes.

```js
// CommonJS — dynamic, runtime-resolved
if (process.env.NODE_ENV === 'production') {
  const logger = require('./prod-logger');
}
```

ESM `import` declarations are static and must appear at the top level. The JS engine can parse them without executing any code.

```js
// ESM — static, parse-time-resolved
import { log } from './logger'; // always top-level
```

This single constraint — static imports — is what gives bundlers the ability to build a complete dependency graph before running anything. It's the prerequisite for tree shaking: if the graph is known ahead of execution, unused exports can be identified and eliminated at build time.

**Live bindings, not copies**

Another mechanical difference: ESM exports are *live bindings*, not value copies. If module A exports a counter and increments it, module B importing that counter sees the updated value. CommonJS would have given B a snapshot at require-time.

This matters for patterns like circular dependencies and re-exported primitives, where CJS can silently hand you stale values.

**Mental model**

Think of CJS as a lazy vending machine — you ask for things at runtime, one by one, and the machine figures it out on the spot. ESM is more like filing a manifest before departure — all dependencies are declared upfront, the environment resolves the full graph, then execution begins. The manifest approach is more predictable and analyzable.

**In practice**

*Frontend*: Every modern bundler (Rollup, Vite, webpack 5 with `experiments.outputModule`) builds on ESM's static structure. When you import only `{ useState }` from React, a bundler using ESM semantics can statically verify whether the rest of React's exports are reachable and eliminate them. This only works because imports are guaranteed to be top-level declarations.

*Fullstack*: Node.js has supported ESM natively since v12 (stable in v14). But CJS/ESM interop remains genuinely awkward — you can't `require()` an ESM module, and `import()` of a CJS module loses named exports. If you're building a library today, deciding which format to ship (or both, via dual-package hazard) is a real architectural decision.

The underlying insight to carry forward: ESM's value isn't ergonomics — it's that static analyzability is a hard prerequisite for the entire ecosystem of build-time optimizations that modern frontend tooling depends on.

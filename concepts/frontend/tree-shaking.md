---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Tree shaking is dead-code elimination performed at bundle time: your bundler statically analyzes which exports are actually imported across your codebase and drops everything else before writing the final output. The payoff is smaller bundles without you manually curating what gets included.

**The core mechanism**

It only works with ES modules (`import`/`export`) because those are *statically analyzable* — the module graph is fixed at parse time, not runtime. CommonJS (`require()`) is dynamic, so bundlers can't safely trace it. When you `import { debounce } from 'lodash-es'`, the bundler sees exactly which export you need and can prove the rest are unreachable. With `import _ from 'lodash'` (CJS), it has to include everything.

The bundler builds a dependency graph starting from your entry point, marks every reachable export as "live," and discards the rest. This is why it's called tree shaking — you're shaking the tree and letting dead leaves fall.

**The sideEffect problem**

The hard part: bundlers have to be conservative. If a module has side effects (modifies globals, patches prototypes, registers something), removing it could break behavior. Bundlers default to assuming any module *might* have side effects unless told otherwise. Libraries opt out via `"sideEffects": false` in `package.json`, or list specific files that do have them. If a library doesn't set this flag, you'll carry dead code even with tree shaking enabled.

**Concrete example**

```js
// utils.js
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b; // never imported anywhere

// main.js
import { add } from './utils.js';
```

`multiply` never appears in the import graph → bundler excludes it. Simple case. The tricky version: you import a class that internally uses `multiply` in a method you never call. Bundlers can't always prune at method-level granularity — that's why smaller, focused exports beat large utility classes for tree shaking.

**Practical patterns**

*Frontend:* Icon libraries and component libraries are the most impactful targets. `import { IconCamera } from '@heroicons/react'` should shake off 300 other icons. If the library isn't ESM or lacks `sideEffects: false`, check if they have a modular entry point (`/esm`, `/es`).

*Fullstack:* Server bundles (Lambda, Edge functions) benefit just as much. A Next.js API route that imports one helper from a large shared utilities package will bloat cold start times if that package isn't shakeable. Keep shared packages ESM-first and mark side-effect-free modules explicitly.

**Common pitfall:** barrel files (`index.ts` that re-exports everything) often defeat tree shaking — some bundlers handle them, some don't. If you're seeing unexpectedly large bundles, check whether your barrel re-exports are being analyzed correctly with a bundle analyzer.

---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Tree shaking is dead code elimination at the module level — bundlers (Rollup, esbuild, Webpack, Vite) statically analyze your import graph and drop any exports that nothing actually uses. The result is a smaller bundle without you manually curating what gets included.

## The Core Mechanism

This only works because ES Modules have **static** import/export syntax. When the bundler parses your code, it can build a complete dependency graph before executing anything — every `import` is at the top level, never inside a conditional or a function call. CommonJS `require()` is dynamic and can appear anywhere, so bundlers can't safely eliminate anything without running the code first.

The bundler starts from your entry point, follows every `import`, and marks which exported bindings are actually referenced. Anything unreferenced gets dropped, along with any code that's only reachable from those dropped exports.

```js
// utils.js
export function used() { /* ... */ }
export function neverImported() { /* ... */ }

// main.js
import { used } from './utils'
used()
```

`neverImported` never appears in an `import` statement, so it doesn't ship.

## The Side Effects Problem

Bundlers can't blindly drop modules, because some code runs on import purely for its effects (polyfills, global registrations, CSS). A bundler that drops `import './analytics'` because nothing uses its exports would break your app silently.

This is why `package.json` has the `"sideEffects"` field. Setting `"sideEffects": false` tells the bundler the package is safe to shake aggressively. Library authors who get this right enable much better tree shaking downstream.

## Frontend Scenario

You install lodash and write `import { debounce } from 'lodash-es'`. With tree shaking, only `debounce` and its internal dependencies ship — not the 300+ other functions. This is exactly why `lodash-es` exists alongside the CommonJS `lodash`: the ES Module version is statically analyzable. Without it, even a single `require('lodash')` would pull the entire library.

Named exports give bundlers more granularity than barrel files that re-export everything, which is why `import { Button } from '@ui/components'` from a well-written library works, but a poorly-structured one with `export * from './Button'` chains can defeat tree shaking.

## Fullstack Scenario

In a Next.js app, tree shaking is the mechanism that prevents server-side code from leaking into client bundles. If your shared `lib/db.ts` exports a database client you only import in server components, the client bundle never sees it — assuming the module graph is clean. This is also why the Next.js compiler warns about large client-side bundles: it's often a sign that something with server-only dependencies got imported on the wrong side of the boundary.

## Practical Gotcha

Bundlers are conservative by default. They'll keep a module if they can't *prove* it's side-effect-free. The `/*#__PURE__*/` annotation on function calls (common in React's compiled output) is a hint that a call has no side effects and can be dropped if its result is unused — you'll see this in compiled JSX.

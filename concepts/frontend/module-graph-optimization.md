---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Module Graph Optimization

At build time, bundlers like webpack or Rollup construct a directed graph of every `import` statement in your codebase. Module graph optimization is the discipline of deliberately shaping that graph so the bundler can split, tree-shake, and parallelize loading as aggressively as possible — rather than letting import patterns accumulate organically until performance degrades.

**The core problem**

Three failure modes compound each other in monorepos:

**Circular dependencies** create loader deadlocks where module A imports B which imports A. Bundlers resolve these (usually silently), but the result is unpredictable evaluation order and modules that can't be tree-shaken because the graph can't determine which side of the cycle is the "root." The real damage: entire subgraphs become unsplittable.

**Barrel files** (`index.ts` re-exporting 40 utilities) are the most common footgun. When one route needs `parseDate` from `@acme/utils`, the barrel import pulls in every export — including the 200kb PDF renderer that sits in the same package. Tree shaking can theoretically eliminate this, but only if the bundler can prove no side effects exist across the entire barrel. In practice, one ambiguous export or `"sideEffects": false` misconfiguration defeats it.

**Chunk boundary misalignment** happens when `splitChunks` or `manualChunks` configuration doesn't match actual import topology. You end up with shared chunks that are artificially large (because two routes import from the same barrel), or duplicated vendor code across chunks (because the graph couldn't find a clean split point due to circulars).

**Concrete mental model**

Imagine your import graph as a subway map. Code splitting draws station boundaries where passengers transfer between trains (async boundaries). If your graph has cycles, some stations are connected in both directions — the routing algorithm freezes. If barrels exist, every passenger who boards at `@acme/utils` drags the entire train with them. Optimization means redrawing the map so trains run one-way and passengers only carry what they need.

**Frontend**

In a Next.js or Vite app, this manifests as bloated initial JS payloads. You audit with `webpack-bundle-analyzer` or `rollup-plugin-visualizer`, find that `shared/components/index.ts` is appearing in 12 chunks, then either split the barrel into targeted imports (`import { Button } from 'shared/components/Button'`) or use `package.json` `exports` map to expose individual entry points.

**Fullstack**

In a monorepo with server and client packages sharing a `@acme/core` library, barrel imports on the server side often accidentally pull client-only code (React components, browser APIs) into SSR bundles — causing runtime crashes. Mapping the module graph explicitly lets you enforce package boundaries via ESLint import rules or Turborepo's `boundaries` config before it reaches production.

**Why this differentiates senior engineers**

Most engineers treat bundle size as a profiling problem. Senior engineers recognize it's a graph topology problem — solved upstream at architecture time by controlling how packages expose their surfaces, not downstream by tweaking bundler config after the fact.

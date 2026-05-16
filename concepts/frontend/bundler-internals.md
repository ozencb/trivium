---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Bundler Internals

A bundler takes a graph of module files and emits a smaller set of files browsers can load efficiently. The problem it solves isn't just concatenation — it's resolving a dependency graph, transforming each node, and stitching references back together correctly.

### The Core Mechanism

Starting from an entry point, the bundler does four things in a loop:

1. **Parse** the file into an AST
2. **Collect** all import/require/dynamic-import statements
3. **Resolve** each specifier to a file path (using `node_modules` resolution, aliases, extensions)
4. **Recurse** into each dependency until the full graph is built

The result is a directed acyclic graph (DAG) where every node is a module and edges are import relationships. This graph is the bundler's internal world model — everything downstream (tree shaking, code splitting, hashing) operates on it.

Once the graph exists, the bundler **links** it: each module gets wrapped or rewritten so its exports are accessible to its importers without relying on native `import` at runtime. In older CommonJS-style output, this was a module registry (`__webpack_require__`). In modern ESM output (Rollup, Vite), this is often just inlining — the module's code is literally moved to where it's imported, with variable names scoped to avoid collisions.

### Mental Model: It's a Linker

If you've ever compiled C, you know the linker's job: take `.o` files, resolve symbol references across them, and produce one binary. Bundlers are the same idea. `import { foo } from './utils'` is an unresolved symbol reference. The bundler's link phase resolves it and replaces the reference with the actual value — statically where possible (enabling tree shaking), or via a runtime lookup where dynamic imports require it.

### Why This Matters in Practice

**Frontend**: When you write `import Button from './Button'` in a React component, the bundler has already traced that back through potentially dozens of re-exports, figured out exactly which code paths are reachable, and emitted only what's used. The output chunk boundaries (what lands in `main.js` vs. a lazy chunk) are decisions made on the dependency graph, not the file system.

**Fullstack (Next.js, Remix, etc.)**: The bundler runs *twice* with different configurations — once targeting Node (server bundle, no DOM polyfills, can omit client-only code) and once targeting browsers (client bundle, no `fs`, `crypto`, etc.). They share the same source but produce completely different graphs because the entry points and platform targets differ. This is why `server-only` and `client-only` packages work: they throw at graph-construction time if they end up in the wrong graph.

### What This Unlocks

Once you see the bundler as a graph problem, tree shaking (pruning unreachable nodes), code splitting (partitioning the graph into async boundaries), source maps (recording the transform history per node), and content hashing (fingerprinting output chunks) all follow naturally — they're just different passes over the same structure.

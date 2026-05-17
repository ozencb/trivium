---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Bundler Internals

A bundler's job is to take a graph of modules with arbitrary dependencies and produce a minimal set of files a browser can load efficiently. The interesting part isn't the file concatenation — it's the series of passes that make correctness and optimization possible simultaneously.

### The Core Mechanism

Bundlers work in four conceptually distinct phases:

**1. Resolution** — Starting from entry points, the bundler walks `import` statements and resolves each specifier to an absolute file path using Node's resolution algorithm (or a configured override). This produces a directed graph where nodes are modules and edges are imports. Circular dependencies are legal; the bundler tracks visited nodes to avoid infinite loops and handles cycles by deferring binding resolution.

**2. Transformation** — Each module is passed through a transform pipeline (Babel, SWC, esbuild's internal parser, etc.) before graph edges are established. Transforms operate on the AST of a single file: stripping types, downleveling syntax, injecting helpers. Critically, transforms run *per module* and are stateless across the graph — cross-module analysis happens later.

**3. Chunking** — The resolved graph gets partitioned into output chunks. Static imports that are always needed together collapse into one chunk. Dynamic `import()` calls become split points, creating async chunks loaded on demand. The bundler solves a set-cover problem: modules shared across multiple chunks get hoisted into a shared chunk to avoid duplication, but only if the trade-off (an extra network round-trip) is worth it.

**4. Emit** — Each chunk is serialized: module code gets concatenated, a runtime shim handles the module registry (for non-ESM targets), and each output file gets a content hash derived from the chunk's complete dependency subtree — not just the file itself. This is why changing a utility deep in your graph causes a hash change to anything that imports it.

### Mental Model

Think of it as a compiler pipeline where the "program" is your entire app. Resolution = parsing includes. Transformation = preprocessing. Chunking = link-time optimization (inlining, dead code). Emit = object file output with symbol addresses finalized.

### Practical Consequences

**Frontend:** When you see a vendor chunk that invalidates on every deploy, it usually means application code leaked into it — something in your app imports a module that also gets imported by a vendor, and the bundler placed it in the wrong chunk. Fixing it means understanding how chunk assignment works, not just adding `splitChunks` config blindly.

**Fullstack (SSR):** Server and client bundles share source but need separate graphs — the server bundle must not reference `window`, the client bundle must not bundle `fs`. Bundlers handle this via *conditions* in `package.json` exports (`browser` vs `node`), which alter resolution at the graph-walk stage. Getting this wrong produces silent failures: code that works in one environment but ships dead/broken code to the other.

The hashing strategy is what makes long-term caching viable: a correctly configured bundler ensures that unchanged modules produce identical output hashes across builds, so users only re-download what actually changed.

---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Module Graph Optimization

The build process constructs a directed graph of every module in your app — nodes are files, edges are imports. Module graph optimization is how bundlers restructure that graph before emitting output to minimize bundle size, reduce duplication, and improve runtime performance. Tree shaking and code splitting are two *specific* optimizations that operate on this graph; module graph optimization is the broader discipline of what you do with the graph as a whole.

### The Core Mechanism

After resolving all imports, a bundler holds a complete picture of every module and who depends on whom. Three main classes of optimization happen here:

**Scope hoisting (module concatenation):** ES modules allow bundlers to merge multiple module scopes into a single flat scope instead of wrapping each in its own function. This cuts closure overhead and dramatically improves minification because the minifier can now rename variables across merged modules. Webpack calls this `ModuleConcatenationPlugin`; Rollup does it by default.

**Chunk graph splitting:** The bundler determines which modules belong in which output chunk. A naive split (one chunk per entry point) duplicates shared modules. A smarter one analyzes intersection paths through the graph: if `utils/format.js` is reachable from both `/checkout` and `/profile`, it gets its own shared chunk. Getting this wrong means users download the same code twice under different names.

**Deduplication:** In a monorepo or a project with deep dependency trees, the same module version can appear multiple times. Bundlers normalize these into a single node in the graph before emitting.

### Mental Model

Think of it like a logistics network. Packages (modules) need to be delivered to destinations (entry points). You could put everything in each truck (one fat bundle), or you could identify shared cargo and route it through a central depot (shared chunk). Module graph optimization is deciding the routing — and scope hoisting is figuring out which packages can be consolidated into a single box before shipping.

### Practical Scenarios

**Frontend:** In a large React SPA with route-based code splitting, the chunk graph determines whether `react-dom` ends up in the vendor chunk, each route chunk, or duplicated everywhere. Misconfigured `splitChunks` thresholds in webpack (e.g., too-high `minSize`) leave shared code uncollected.

**Fullstack (monorepo):** With a Next.js app consuming shared packages from a workspace, the bundler has to traverse the module graph *across package boundaries*. Unoptimized graphs here mean internal packages ship with their own copies of peer dependencies, inflating both server and client bundles. Tools like `@vercel/nft` (Node File Tracing) do a graph walk to determine the minimal set of files needed for a lambda — this is module graph optimization applied to the server side.

The leverage is highest when you understand what the graph looks like before and after — most bundlers expose this via bundle analyzers or stats JSON.

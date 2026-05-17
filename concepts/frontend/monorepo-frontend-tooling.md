---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Monorepo Frontend Tooling

In a monorepo, naively running `build` or `test` across all packages on every change doesn't scale — you end up rebuilding unchanged packages and waiting minutes for a 5-line change. Build orchestrators like Nx and Turborepo solve this by treating your repo as a task graph rather than a collection of independent scripts.

**The core mechanism**

These tools model your monorepo as a directed acyclic graph where nodes are tasks (`build`, `test`, `lint`) and edges represent dependencies — both package dependencies *and* task dependencies (e.g., `app#build` depends on `ui-lib#build`). Given that graph, they can determine:

1. **Affected scope**: which packages are transitively affected by a file change (via git diff + dependency graph)
2. **Execution order**: which tasks must complete before others can start
3. **Cache hits**: whether a task's inputs (source files, env vars, deps) are identical to a previous run, making re-execution pointless

The caching is content-addressed — Turborepo hashes task inputs and stores outputs (build artifacts, stdout) keyed to that hash. On a cache hit, it replays the output without running the task. Remote caching extends this across machines: CI and every developer share the same cache, so you genuinely never run the same computation twice.

**Mental model**

Think of it like `make` with dependency tracking, but aware of your package graph and capable of parallelizing across CPU cores. Where webpack or Vite handles *how* to build one package, Turborepo handles *which* packages to build and *when*, in *what order*.

**Frontend context**

The clearest win is in a design system repo: `packages/tokens` → `packages/components` → `packages/docs`. Changing a token file should rebuild tokens, then components, then docs — in that order, in parallel where possible. Without orchestration, you either rebuild everything or write fragile custom scripts. With Turborepo's `pipeline` config, this is a 10-line `turbo.json`.

**Fullstack context**

When your API, shared types, and frontend live together, the graph gets richer: `packages/types` → both `apps/api` and `apps/web`. A change to a shared DTO triggers type-checking in both apps. Nx adds generators and project inference on top of this — useful when your fullstack team wants enforced boundaries (e.g., preventing the frontend from importing server-only modules via lint rules derived from the graph).

**When to reach for this**

If you have 3+ packages with shared dependencies and CI is slow, this is the right tool. The break-even point is lower than most teams expect — the config is minimal, and the remote cache alone often cuts CI time by 50–70% on the first week. The pitfall is over-engineering the pipeline config early: start with `build` and `test` tasks, add `dependsOn` constraints only when you hit ordering bugs.

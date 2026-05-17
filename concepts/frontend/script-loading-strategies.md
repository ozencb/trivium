---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Script Loading Strategies

The browser's HTML parser is single-threaded — when it hits a `<script>` tag, it stops, fetches, parses, and executes the script before continuing. Script loading strategies let you break that synchronous chokehold, choosing exactly when fetch and execution happen relative to parsing.

### The Core Mechanism

There are four meaningful positions/attributes, each with distinct fetch and execution timing:

**Blocking (default, no attribute):** Parser halts on encounter. Fetch + execute before HTML parsing resumes. Use for truly critical inline logic only — anything that must run before the DOM exists.

**`async`:** Fetch happens in parallel with parsing. Execution happens *immediately when the fetch completes* — parser pauses at that point. Scripts can execute out of order relative to each other. Good for independent third-party scripts (analytics, ads) where order doesn't matter and you don't need the DOM ready.

**`defer`:** Fetch happens in parallel with parsing. Execution is deferred until HTML is fully parsed, and scripts execute *in document order*. This is the right default for most first-party scripts — you get parallelized fetch with predictable, ordered execution.

**`type="module"`:** Behaves like `defer` by default. Also enables ESM `import`/`export`, scoped module context (no global leakage), and strict mode automatically. Modern bundler output typically lands here.

### Mental Model

Imagine HTML parsing as a conveyor belt. Default scripts are workers who physically stop the belt to do their job. `async` workers step in whenever they're personally ready, stopping the belt briefly but unpredictably. `defer` workers queue up, wait for the belt to finish, then go in order. `type="module"` workers do the same as defer but operate in a clean room with their own tools.

### Practical Scenarios

**Frontend:** You're building a React SPA. The bundled JS is enormous but shouldn't block initial HTML render. `defer` on the bundle script lets the browser paint the shell (skeleton, nav) while the script fetches. Users see something faster even if interactivity lags.

**Fullstack (SSR/hydration):** You're server-rendering a Next.js or Astro page. The HTML comes pre-rendered, so you want the hydration script to wait until the full DOM is present — `defer` again. If you use `async` here, the hydration script might execute before SSR'd HTML is parsed, leading to mismatches or double-renders.

### Common Pitfalls

- Using `async` for scripts that depend on each other — load order is non-deterministic, things break randomly.
- Putting `defer` on inline scripts — it's silently ignored; inline scripts always execute synchronously.
- Assuming `type="module"` is always slower — browsers cache modules aggressively and deduplicate imports.
- Placing scripts in `<head>` without `defer`/`async` — classic mistake that tanks time-to-first-contentful-paint.

The practical rule: `defer` for your own scripts, `async` for isolated third-party tags, `type="module"` if you're shipping ESM.

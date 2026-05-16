---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Client-Side Hydration

Hydration is the process by which a client-side framework takes ownership of server-rendered HTML and makes it interactive. SSR gives you fast, parseable markup; hydration is the step that closes the gap between "looks ready" and "actually works."

### The Core Mechanism

The server renders your component tree to static HTML and sends it. The browser paints it immediately — no JS required. Then the JS bundle arrives and the framework needs to attach event listeners, initialize state, and set up reactivity. Rather than blowing away the DOM and re-rendering from scratch, the framework *walks the existing DOM tree* and reconciles it against the component tree it would have produced, reusing nodes instead of recreating them.

The critical invariant: the server output must match what the client would render on first pass. If they diverge — say, a component reads `Date.now()` or `window.innerWidth` — the framework detects a mismatch and falls back to a full client-side re-render, discarding the server HTML entirely. This is expensive and the source of many subtle SSR bugs.

### Mental Model

Think of server HTML as a fully built stage set — structurally complete, visually correct, but with no electricity. Hydration is the crew wiring up the lighting rigs, motors, and sound systems without tearing down and rebuilding the set. The audience (user) sees the set the whole time; they just can't interact with it until the crew finishes.

### In Practice

**Frontend:** In a Next.js app, your product page renders immediately, but the "Add to Cart" button is inert until hydration completes. Users can read content, but interactions are blocked. For slow connections or JS-heavy bundles, this window — visually ready but non-interactive — is a real UX problem, measurable as Time to Interactive vs. First Contentful Paint diverging.

**Fullstack:** Any data fetched server-side must be serialized into the HTML (typically a `<script>` tag with JSON) and re-consumed by the framework during hydration. This is the dehydrate/rehydrate pattern in React Query or TanStack Router's SSR support. If the client fetches fresh data instead, the tree won't match and you'll trigger a remount. The serialization cost is real — large payloads bloat your HTML and slow hydration.

### Why This Matters for What's Next

Full hydration treats the entire component tree as interactive, regardless of which parts actually need to be. That's the inefficiency that Partial Hydration addresses — skip hydrating components that have no client-side behavior, shrink the JS bundle, and reduce Time to Interactive. Understanding hydration as a *reconciliation pass over the full tree* makes it clear why partial approaches are non-trivial: you have to tell the framework which subtrees to skip, and those subtrees become static boundaries.

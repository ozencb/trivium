---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Hydration Mismatch Debugging

When SSR renders HTML on the server and the client hydrates it, React (or similar frameworks) expects the DOM it finds to match exactly what it would have rendered itself. A mismatch breaks this contract, causing React to either throw a warning, re-render the entire subtree, or produce invisible bugs where interactive state silently diverges from what the user sees.

**The core mechanism**

During hydration, React doesn't re-render from scratch — it walks the existing server-rendered DOM and attaches event listeners while reconciling nodes against the virtual DOM it constructs client-side. If a node's tag, attributes, or text content differ even slightly, React detects the divergence and bails out, usually with a full client re-render of that subtree. In production, React suppresses the warning but still does the re-render — which defeats much of the SSR performance benefit and can produce layout flashes.

The tricky part: the mismatch often isn't in the component you're looking at. It propagates upward through the tree, and React reports the mismatch at the boundary, not the source.

**Concrete mental model**

Think of it like two people assembling the same IKEA furniture from the same instructions, but one person skipped step 3. When they compare notes later, everything from step 4 onward looks different — even though the underlying mistake was small and early.

**Common causes**

- **`Date.now()` or `Math.random()` in render** — server and client produce different values
- **`typeof window !== 'undefined'` checks** — a component that renders nothing server-side renders something client-side, or vice versa
- **Browser extensions** — injecting DOM nodes (ads, password managers) that React didn't put there
- **Invalid HTML nesting** — `<p>` inside `<p>`, `<div>` inside `<a>` — browsers silently fix these differently on client vs. server

**Frontend scenario**

A `<Tooltip>` component reads `window.innerWidth` to decide positioning. Server renders it with a default, client renders it with the actual viewport — mismatch. Fix: wrap the width-dependent render in a `useEffect` or use `suppressHydrationWarning` if the difference is cosmetic and intentional.

**Fullstack scenario**

Your Next.js app renders a user greeting server-side. You pull the locale from `navigator.language` instead of a cookie or Accept-Language header. Server says "Hello", client says "Hola". The mismatch cascades if the greeting is inside a larger layout — React may re-render a wide subtree, causing a visible flash on load.

**Debugging approach**

1. Enable React's strict mode — it surfaces these in development
2. Search for `suppressHydrationWarning` already in the codebase — it's often a sign someone already papered over a mismatch
3. Diff the server-rendered HTML (`curl` the page) against what React would render client-side — they need to match byte-for-byte in text nodes and attribute order
4. Isolate time/randomness/browser-API access behind effects or server-safe defaults

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Client-Side Hydration

SSR gives you fast first paint and crawlable HTML, but the browser needs to wire up interactivity after the fact. Hydration is that wiring step: the framework walks the existing DOM, reconciles it against its virtual representation, and attaches event handlers — without touching the nodes themselves.

**The core mechanism**

When React (or any VDOM-based framework) hydrates, it does a tree walk comparing what the server sent with what `renderToString` (or equivalent) *would* produce on the client. If they match, React skips creating new nodes and just binds state and event listeners in place. This is why the invariant is strict: **server-rendered markup must be byte-for-byte equivalent to what the client would render from the same props.** A mismatch forces React to throw away the server HTML and re-render from scratch — you get a hydration error and lose the SSR benefit entirely.

Under the hood, React 18 uses `hydrateRoot` instead of `createRoot`. The difference: `createRoot` creates a fresh tree, `hydrateRoot` adopts the existing DOM. The fiber tree gets built in memory, but DOM mutations only happen on mismatch.

**Mental model**

Think of SSR output as a puppet with no strings, and hydration as attaching the strings. The puppet's shape doesn't change — you're not re-carving it — you're just making it controllable. The danger: if the puppet you receive doesn't match the pattern your string-attacher expects, you have to rebuild from scratch.

**Where mismatches come from**

The most common pitfall is time/environment-dependent rendering: `new Date()`, `window.innerWidth`, `localStorage` reads, or anything that differs between Node and browser. A component that renders `"Welcome back, Alice"` on the server but `"Welcome back, undefined"` on the client will cause a mismatch. The fix is to defer that rendering to `useEffect` or use suppression (`suppressHydrationWarning`) sparingly for genuinely unavoidable differences.

**Practical implications**

*Frontend:* In a Next.js app, any component that reads browser APIs (`window`, `document`, navigator) needs special handling — either dynamic imports with `ssr: false`, or gating the render behind a mounted-state check. Skipping this is probably the #1 source of hydration bugs in production Next apps.

*Fullstack:* When you control the data fetching (e.g., tRPC or server actions), ensuring the serialized props passed from server to client exactly match what the client would derive independently is critical. The `__NEXT_DATA__` JSON blob embedded in the HTML is the single source of truth; any drift between that and what the component renders will cascade into hydration failures.

This concept is the foundation for **partial hydration** — the idea that you don't need to hydrate the entire tree upfront, only the interactive islands. Once you understand that hydration is a reconciliation pass over existing DOM, it's obvious why you could skip it entirely for static subtrees.

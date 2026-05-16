---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## React Server Components

React Server Components (RSC) let you render components exclusively on the server — not as a build-time snapshot (like static SSG) or a full-page render (like SSR), but as a persistent server-side component that never ships its code to the browser.

### The Core Mechanism

Traditional SSR renders the full component tree on the server, sends HTML, then *re-renders the same tree in the browser* during hydration. Every component — even one that just fetches and displays data — ships its code, dependencies, and runtime to the client.

RSC breaks the component tree into two kinds: **Server Components** run only on the server and are never hydrated. **Client Components** (marked `"use client"`) work like components you know today. The server streams a serialized description of the rendered Server Component tree (not HTML — a special React wire format) to the client, where it gets reconciled into the existing tree.

The key insight: Server Components can be *interspersed* with Client Components. A server component can render a client component as a child. A client component cannot render a server component directly — but it can receive one as a prop (via `children` or similar), because that subtree was already resolved on the server.

### Mental Model

Think of it like a template engine that understands React. A Server Component is like a PHP/Blade template — it has full access to the database, filesystem, secrets — but instead of outputting HTML strings, it outputs a React tree. That tree gets handed off to a React runtime that knows which parts need client-side behavior.

### Practical Implications

**Fullstack:** You can query your database directly inside a component with no API layer:

```tsx
// No useEffect, no fetch, no loading state
export default async function UserProfile({ id }) {
  const user = await db.users.findUnique({ where: { id } });
  return <div>{user.name}</div>;
}
```

This isn't a build-time query — it runs per-request on the server. You collapse the backend-for-frontend layer for data fetching.

**Frontend:** Bundle size drops significantly. A markdown renderer, a syntax highlighter, a date library — if they're only used in Server Components, they're never included in the client bundle. You get the component model without the weight.

**Coexistence with Streaming SSR:** RSC composes with Suspense streaming. Server Components can suspend, letting the shell render immediately while data-dependent subtrees stream in — without any client-side fetching waterfalls.

### The Tradeoff

The mental model overhead is real: you need to track which components can use hooks/event handlers (client only) versus which can access server resources (server only). The `"use client"` boundary becomes an architectural decision, not just a file annotation. Get it wrong and you either over-ship code to the browser or hit serialization errors when you try to pass non-serializable values (functions, class instances) across the boundary.

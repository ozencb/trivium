---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## React Server Components

React Server Components (RSC) let you render components exclusively on the server and send only their serialized output to the client — no JavaScript, no hydration. Where Streaming SSR gives you faster time-to-first-byte by piping HTML in chunks, RSC goes further: the component's code itself never ships to the browser.

**The core mechanism**

RSC introduces a two-world model. Server components run once on the server (they can be `async`, query databases, read files directly) and emit a serialized React tree — not HTML, but a JSON-like payload describing the UI. Client components (`'use client'`) still hydrate normally. The framework reconciles both into a single coherent tree.

The critical insight: RSC is a protocol, not just a rendering strategy. The server streams a description of the tree, and the client reconstructs it. This means client-side navigation can refetch only the RSC payload for a route — no full page reload, no re-running client components that didn't change.

**Mental model**

Think of it as a clean split between "components that compute" and "components that interact." A server component is like a stored procedure for UI — it runs close to the data, produces output, and disappears. A client component is the part that needs the DOM, event handlers, and browser state.

```jsx
// This runs only on the server — DB client never ships to browser
async function UserProfile({ userId }) {
  const user = await db.users.findById(userId); // direct DB call
  return <ProfileCard user={user} />;
}

// This ships to client — has interactivity
'use client';
function ProfileCard({ user }) {
  const [expanded, setExpanded] = useState(false);
  return <div onClick={() => setExpanded(!expanded)}>{user.name}</div>;
}
```

**Practical scenarios**

*Frontend:* Navigation bars, sidebars, and data-heavy layouts become server components. No `useEffect` data fetching, no loading spinners, no leaking your ORM into the bundle. The `sharp` image processing library or a 50KB date formatting library stays server-side.

*Fullstack:* You can eliminate entire API routes. A dashboard page queries the DB in the server component and passes serializable data down to client components for interactivity. The data access layer lives in the component tree, not a separate layer.

**Where engineers get tripped up**

The `'use client'` boundary is viral — everything a client component imports also becomes client-side. A common mistake is putting a heavy library behind a client component unnecessarily. Also, props crossing the server/client boundary must be serializable — no functions, no class instances, no React context.

The other pitfall: RSC doesn't replace client state or event-driven UI. If a component needs `useState`, `useEffect`, or DOM access, it must be a client component. Trying to push too much to the server produces awkward prop-drilling just to pass callbacks back up.

**Why this matters in design discussions**

RSC forces a deliberate conversation about where data-fetching responsibility lives. The senior move is knowing when the boundary belongs at the page level versus the component level, and understanding that RSC shifts architecture decisions that used to happen in API design into the component tree itself.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Suspense Boundaries

Suspense lets you treat async operations as a first-class part of your render tree rather than imperative state you manage yourself. Instead of `isLoading` flags scattered through components, you declare *where* loading states live structurally — the same way error boundaries declare where errors are caught.

**The core mechanism**

React Fiber's concurrent rendering made this possible: when a component "suspends" — throws a Promise during render — React walks up the tree looking for the nearest `<Suspense>` boundary. It renders that boundary's `fallback` instead, then retries the suspended subtree once the promise resolves. The component itself doesn't know it suspended; it just re-renders and this time the data is there.

Data-fetching libraries (React Query, SWR, Relay) integrate by throwing a promise on cache miss and resolving it when the fetch completes. Lazy-loaded code via `React.lazy()` does the same — throws a promise that resolves to the module.

```jsx
<Suspense fallback={<Spinner />}>
  <UserProfile userId={id} />   {/* suspends on cache miss */}
  <UserPosts userId={id} />     {/* suspends independently */}
</Suspense>
```

Both components suspend independently and resolve independently — React doesn't wait for one before retrying the other.

**Where it actually matters**

*Frontend:* Route-level code splitting is the obvious win — wrap each lazy route in Suspense and you get loading states for free without boilerplate. The more nuanced use is nesting boundaries to tune granularity. A coarse boundary at the page level hides everything until ready; finer boundaries let above-the-fold content appear while a sidebar still loads. Getting that hierarchy wrong is the most common pitfall — either too coarse (bad perceived performance) or too fine (spinner hell).

*Fullstack (Next.js App Router, Remix):* Server Components stream into the client, and Suspense boundaries determine *when* each chunk flushes. A `<Suspense>` around a slow DB query means the shell HTML ships immediately, then the component streams in when the data is ready — no client-side fetch needed. The boundary placement directly controls your TTFB vs. full-page render tradeoff.

**Pitfalls worth knowing**

- Suspense doesn't catch async functions in event handlers or effects — only during render. If you're awaiting inside a `useEffect`, you're outside its reach.
- Waterfalls: if a suspended component only *starts* its fetch after it first renders, you've serialized requests. Libraries like Relay solve this by hoisting data requirements; otherwise, parallel fetching at the route level matters.
- `startTransition` integrates tightly here — wrapping navigation in a transition keeps the current UI visible instead of immediately showing the fallback, which usually feels better.

Think of Suspense boundaries as async bulkheads: they define failure (loading) containment zones so the rest of the tree keeps working.

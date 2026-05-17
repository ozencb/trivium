---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Server State Management

Server state is fundamentally different from UI state: it lives remotely, can change without your app knowing, and multiple components often need the same slice of it. Libraries like React Query and SWR exist because `useState` + `useEffect` + `fetch` is a trap — you end up re-implementing cache invalidation, deduplication, and loading states everywhere, badly.

**The core mechanism** is a normalized cache keyed by query identifiers. When two components both call `useQuery(['user', id])`, they share one network request and one cache entry. The library tracks whether that entry is "fresh" or "stale" based on a configurable TTL, and when stale, it serves the cached value immediately (so no loading flicker) while revalidating in the background. This is the stale-while-revalidate pattern, and it's why these libraries feel fast even over slow connections.

**Mental model:** think of it like an HTTP proxy cache sitting inside your app. Your components don't fetch — they declare what data they need and the cache decides whether to hit the network. Cache misses are transparent; cache hits are instant.

**Mutations are where it gets interesting.** Optimistic updates let you update the cache immediately on user action, then reconcile with the server response. If the mutation fails, you roll back. React Query handles this rollback via the `onMutate`/`onError`/`onSettled` hooks. The practical implication: a "like" button or a drag-and-drop reorder feels instant without you manually managing local shadow state.

**For frontend engineers**, the main pitfall is over-invalidating. `queryClient.invalidateQueries()` is tempting to spray everywhere after mutations, but it triggers unnecessary refetches. Be surgical — invalidate only the keys that actually changed, or better, use `setQueryData` to update the cache directly when the mutation response already contains the fresh data.

**For fullstack engineers**, server state management clarifies the boundary between what should live in your state library vs. your global store (Redux, Zustand). A common mistake is putting server-fetched data in Redux — now you have two sources of truth with different invalidation semantics. The rule of thumb: if it came from the server and can go stale, it belongs in React Query. If it's purely client-driven (a modal being open, a selected theme), it belongs in local or global UI state.

**When to reach for it**: any app doing more than one or two fetches. The boilerplate elimination alone justifies it, but the real value is cache coherence across components — something that's nearly impossible to get right manually at scale.

This sets you up for React Server Actions, which push some of this invalidation logic to the server itself, blurring the boundary between mutation and revalidation further.

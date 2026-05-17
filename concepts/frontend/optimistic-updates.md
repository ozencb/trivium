---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Optimistic updates are a UX strategy where you apply a mutation to local state immediately — before the server responds — then either reconcile with the real response or roll back if it fails. The premise is that most requests succeed, so why make users wait?

**The core mechanism**

The flow is: (1) user triggers an action, (2) you immediately update local state as if it succeeded, (3) you fire the async request, (4) on success you optionally sync the server's canonical response back; on failure you revert. The tricky part isn't the happy path — it's tracking enough "before" state to cleanly undo the optimistic change, and handling edge cases like multiple in-flight mutations that might interleave.

A concrete model: imagine a todo list. User clicks "Mark complete." Naive approach: disable the checkbox, wait 300ms, re-enable it checked. Optimistic approach: check it immediately, kick off the PATCH in the background. If the request fails, uncheck it and show an error. The user barely notices the network round-trip happened at all.

**Where it matters**

Frontend: React Query and SWR both have first-class `onMutate` hooks for this pattern. You store a snapshot of the cache before mutation, apply the optimistic change, then in `onError` you restore from the snapshot. Libraries handle the rollback plumbing — your job is knowing when to opt in.

Fullstack: If you own both sides, you can design the API response to return the updated entity with server-generated fields (timestamps, IDs), then merge that back into your local state post-confirmation. This keeps client and server in sync without a second fetch.

**When to reach for this**

- Low failure rate mutations: liking a post, reordering a list, toggling a setting. These feel snappy.
- High-latency networks or slow backends: even a 200ms round-trip is noticeable on every keystroke or tap.

**Common pitfalls**

The biggest one is forgetting that the server response might differ from what you assumed. If your optimistic state shows `id: null` (you don't know the server-generated ID yet) and something else tries to reference that entity, you have a race. Similarly, concurrent mutations — user marks item complete, then immediately deletes it before the first response comes back — require careful ordering guarantees or you'll apply a success callback on a stale entity.

Another footgun: silent failures. If your rollback logic is broken or swallowed, the UI shows success but the server never persisted it. Always surface errors visibly, even if the optimistic path felt complete.

The pattern is a deliberate trade: you accept code complexity in the mutation/rollback layer in exchange for perceived performance. For read-heavy UIs or mutations that rarely fail under normal conditions, that trade is almost always worth it.

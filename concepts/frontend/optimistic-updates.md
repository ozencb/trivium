---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Optimistic Updates

Assume the server will succeed and update the UI immediately — then reconcile (or roll back) when the response actually arrives. The goal is eliminating perceived latency for operations that almost always succeed.

### The Core Mechanism

Normally you: send request → wait → update UI on success. With optimistic updates you: update UI immediately → send request → confirm or revert.

The key insight is that you're not "lying" to the user — you're betting that the success path is overwhelmingly likely, and you're right almost every time. The complexity you're buying into is handling the rare failure: you need to store enough state to reverse the mutation if the server rejects it.

This means three things need to happen atomically from the UI's perspective:
1. Apply the change locally (to state, cache, whatever you're using)
2. Store a snapshot or inverse operation to enable rollback
3. Kick off the network request in the background

### Concrete Mental Model

Think of a "like" button on a post. The naive implementation disables the button, shows a spinner, waits 200-500ms, then increments the count. The optimistic version increments the count and toggles the button *instantly*, fires the API call, and only touches the UI again if something goes wrong.

From the user's perspective, the app feels instant. From your perspective, you've introduced a small state management problem: what happens if the API returns 401, 409 (conflict), or 500? You revert — quietly if possible, or with an error message if not.

### Practical Scenarios

**Frontend (React/SPA):** Most visible with mutation-heavy UIs — todo apps, social feeds, collaborative tools. Libraries like TanStack Query and SWR have `onMutate`/`rollback` hooks built for this. You optimistically update the cache before the request, and `onError` you restore the previous cache state. The ergonomics are decent; the risk is that cache management gets subtle when multiple mutations are in-flight simultaneously.

**Fullstack:** Where this gets serious is in collaborative apps (Figma, Linear, Notion). You're optimistically applying operations locally, syncing them to the server, and reconciling against other users' concurrent changes. This is where Operational Transformation (OT) or CRDTs enter the picture — they're essentially formal systems for making optimistic updates composable and conflict-free. For most apps you don't go that far, but understanding optimistic updates is the prerequisite for understanding why those systems exist.

### When Not To Use It

Avoid it for destructive or irreversible operations (deleting an account, completing a payment), or anywhere the failure rate is non-trivial (e.g., form submissions with server-side validation). The UX of "undo-ing" something the user thought was done is worse than a brief spinner.

The pattern is fundamentally a latency-vs-correctness tradeoff, weighted toward latency because modern APIs are reliable enough to make the bet worth taking.

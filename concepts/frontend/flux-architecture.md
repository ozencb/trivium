---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Flux Architecture

Flux is a pattern that enforces unidirectional data flow to make state changes in complex UIs predictable and auditable. It was designed to solve the cascading update problem that emerges when views can mutate state that other views depend on—the root cause of the "I changed this, and that broke over there" class of bugs.

**The core mechanism**

The invariant Flux enforces is this: data flows in one direction only—Action → Dispatcher → Store → View—and views cannot write directly to state. Instead, they emit Actions (plain objects describing intent), which the Dispatcher broadcasts to all registered Stores, which update themselves and emit change events, which re-render the View.

The Dispatcher is the critical piece that's often glossed over. It's a singleton that serializes action dispatch—no action can be processed while another is being handled. This eliminates an entire class of race conditions where interleaved mutations produce inconsistent state. The Dispatcher also allows stores to declare dependencies on other stores (`waitFor`), giving you explicit, inspectable ordering of side effects.

**Mental model**

Think of it like an accounting ledger. You don't go back and change a prior entry when a correction is needed—you append a new entry that adjusts the balance. Actions are immutable facts about what happened; stores derive current state by applying those facts in order. This makes the state at any point in time fully reproducible from the action history.

**Frontend**

In a dashboard with a notification badge, a message list, and a sidebar—all showing "unread count"—a direct mutation approach creates fan-out update problems. With Flux, one `MARK_READ` action hits the MessageStore, which computes the new unread count, and every subscriber re-renders from that single source of truth. You never have views out of sync with each other.

**Fullstack**

When you're designing APIs for SPAs, Flux thinking shapes how you model server events. A WebSocket message arrives—it becomes an Action dispatched into the client store, not a direct property mutation on a component. This means your server-push logic and your user-interaction logic go through the same pipeline, debuggable in the same way. Redux DevTools time-travel debugging is a direct consequence of this: because state is a pure function of actions, you can replay or rewind history deterministically.

**Why it matters in senior conversations**

Flux is the architectural argument for why two-way data binding (Angular 1, early Vue) becomes painful at scale—it allows cycles. Understanding Flux lets you articulate *why* lifting state up or using a global store is the right call when component hierarchies get deep, rather than just asserting it. It also frames the selector memoization problem correctly: if every action re-derives state, you need memoized selectors to avoid recomputing expensive derivations on every dispatch.

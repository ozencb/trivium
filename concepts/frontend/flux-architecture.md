---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Flux Architecture

Flux is a pattern for managing application state by enforcing a **strictly unidirectional data flow** — it exists because two-way data binding between components and models becomes a debugging nightmare as apps grow.

### The Core Mechanism

Flux has four parts: **Action → Dispatcher → Store → View**. The critical constraint is that this is a one-way loop, never a two-way binding.

- **Action**: A plain object describing *what happened* (`{ type: 'ADD_ITEM', payload: item }`)
- **Dispatcher**: A singleton event bus. Every action goes through it; it broadcasts to all stores
- **Store**: Holds state and business logic. Listens to the dispatcher, updates itself, emits a change event
- **View**: Reads from the store, renders, and dispatches new actions on user interaction

The invariant that makes this useful: **stores never call each other directly**, and **views never mutate state directly**. Everything is mediated through actions.

### Mental Model

Think of it like a newsroom. Reporters (views) can file stories (dispatch actions). Editors (stores) receive those stories through the wire service (dispatcher) and decide how to update the record. The published paper (view) only reflects what the editors approved. A reporter can't walk into the archive and change past issues — they file a new story.

This means when a bug occurs, you trace backwards: what action fired? What did the store do with it? The causal chain is always explicit and linear.

### Practical Scenarios

**Frontend:** You have a shopping cart. Without Flux, a `CartIcon` component and a `CheckoutPage` component might both hold cart state, with props drilling everywhere or ad-hoc event listeners keeping them in sync. With Flux, there's one `CartStore`. Both components read from it. A user clicking "Add to cart" dispatches `ADD_TO_CART`, the store updates, and every subscribed view re-renders. State lives in one place; the question "what's in the cart right now?" has one authoritative answer.

**Fullstack:** Flux maps cleanly onto how you likely already think about server-side request handling — a request comes in (action), it's routed (dispatcher), a service layer mutates state (store), and a response is returned (view). When you adopt Flux on the frontend, you're essentially applying the same discipline you already use in your API layer to UI state.

### Why It Matters for Selector Memoization

Because all state lives in stores and views are purely derived from that state, you often end up computing expensive derivations (filtered lists, aggregated totals) on every render. Selector memoization is the performance answer to that — it only makes sense as a concept once you have this single-store, derived-view model that Flux establishes.

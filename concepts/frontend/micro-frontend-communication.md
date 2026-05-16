---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Micro-Frontend Communication

Micro-frontends solve deployment isolation, but they introduce a harder problem: how do independent apps share state and coordinate behavior without coupling back into a monolith? Communication is where the architectural discipline either holds or collapses.

### The Core Problem

Each MFE owns its own runtime, framework instance, and state. They can't just import from each other — that creates the tight coupling you split them apart to avoid. So you need contracts: well-defined channels that let MFEs stay ignorant of each other's internals while still reacting to shared events.

### The Main Patterns

**Custom DOM events** are the loosest coupling available. Any MFE can fire `window.dispatchEvent(new CustomEvent('cart:item-added', { detail: { sku } }))` and any other MFE can listen without either knowing the other exists. The tradeoff: no type safety, no guaranteed delivery, and debugging gets painful fast.

**Shared state via the shell** is common in Module Federation setups. The host/shell app owns a global store (Zustand, Redux, a plain reactive object) and exposes it as a shared singleton. MFEs import the store from the shell's exposed module — they read and write to a single source of truth. This is cleaner than events for state that persists across MFE mounts/unmounts.

**URL as the contract** is underused but extremely durable. Query params and route segments survive page refreshes and work across any tech stack. If MFE A needs to tell MFE B "user is filtering by region=EU," encoding that in the URL means even a full navigation preserves it.

**Direct props from the shell** works when the shell orchestrates child MFEs. The shell holds state and passes data down via framework bindings or web component attributes. Simple, but it centralizes logic in the shell — fine until the shell becomes a new monolith.

### Concrete Mental Model

Think of it like a city's public transit system. Each bus line (MFE) runs on its own schedule and doesn't know about other lines. The shared stops (event bus, URL, shell state) are the coordination layer. Buses don't call each other — they just announce arrivals at shared stops and passengers transfer.

### Practical Scenarios

**Frontend:** A header MFE needs to update a cart badge when a product MFE adds an item. Fire a `cart:updated` custom event from the product MFE; the header listens and re-renders. Neither knows the other exists.

**Fullstack:** A checkout MFE needs the authenticated user's identity, which an auth MFE manages. Rather than the checkout MFE calling the auth service directly, the shell exposes a shared `authStore` via Module Federation — checkout reads from it, auth writes to it.

The failure mode to avoid: letting MFEs import each other directly, or letting the shell accumulate so much coordination logic that it becomes a god object. Keep channels narrow and typed; treat communication contracts with the same rigor as API contracts.

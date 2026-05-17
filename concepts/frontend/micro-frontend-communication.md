---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Micro-Frontend Communication

Micro-frontends solve the deployment boundary problem, but introduce a harder one: how do independent apps share state without coupling back into a monolith? The answer is treating the browser itself as the message bus, not JavaScript imports.

### The Core Mechanism

When you import state directly between micro-frontends—even via Module Federation's shared singletons—you create a deployment coupling. If Team A's shell depends on Team B's exported `useCartStore`, you've rebuilt the coordination problem you were solving. The decoupled alternative: communicate through the browser's native event system, where the emitter and receiver never reference each other's modules.

Two primary mechanisms:

**Custom DOM Events** — dispatch on `window`, subscribe from anywhere:
```js
// cart MFE emits
window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 3 } }));

// header MFE listens
window.addEventListener('cart:updated', (e) => setCount(e.detail.count));
```

**Broadcast Channel API** — works across tabs and iframes, survives navigation:
```js
// any MFE
const ch = new BroadcastChannel('app-events');
ch.postMessage({ type: 'user:logged-in', userId: 42 });

// another MFE, possibly in a different iframe
ch.onmessage = ({ data }) => { if (data.type === 'user:logged-in') ... };
```

Custom events are simpler for same-page communication. Broadcast Channel is the right call when your MFEs load in separate iframes or you need cross-tab sync (think auth logout).

### Mental Model

Think of it like microservice communication—you wouldn't have Service A directly call Service B's internal methods; you'd publish an event to a message broker. The browser is your broker. The "contract" is the event name and payload shape, not a shared module. Teams can evolve internals freely as long as the event interface holds.

### Practical Scenarios

**Frontend:** An e-commerce shell hosts a cart MFE and a product MFE owned by different teams. When a user adds an item, the product MFE fires `cart:item-added`. The cart MFE and header badge MFE both listen independently. No shared store, no cross-team PR needed to add a new listener.

**Fullstack:** A logged-in user's session expires. Your auth service (backend) responds with 401. Your API layer MFE catches it and broadcasts `auth:session-expired` via Broadcast Channel. Every other MFE—regardless of tab—catches it and redirects to login. This is coordination that's genuinely hard to do cleanly without a shared channel.

### Where Engineers Miss This

The common trap is reaching for Module Federation's `shared` config to solve communication—it feels convenient but entangles release cycles. Another pitfall: undocumented event contracts. Since the events aren't type-checked at import time, teams drift. The senior move is maintaining an explicit event catalog (even a TypeScript declaration file) as the cross-team contract.

In design discussions, proposing event-based communication signals you understand the *organizational* constraint micro-frontends are solving, not just the technical one.

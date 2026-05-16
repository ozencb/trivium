---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Micro-Frontends

Micro-frontends apply the microservices idea to the UI layer: instead of one team owning a monolithic frontend, multiple teams independently build, deploy, and own distinct slices of the same user-facing application.

**The core mechanism**

The browser assembles a page from pieces that were built and deployed separately. Those pieces can be composed at three different points:

- **Build time** — each team publishes a package, a shell app imports them as dependencies. Simple, but re-deploys the whole shell on any change.
- **Server-side** — an edge layer (nginx, CDN, BFF) stitches HTML fragments from different origins before the response lands in the browser. Fast first paint, complex infrastructure.
- **Runtime (client-side)** — the shell app dynamically loads remote JavaScript bundles at runtime. Each team ships independently; the browser wires them together on page load. This is the dominant modern approach, and it's the mechanism that Module Federation was built to formalize.

Each micro-frontend typically owns its own route or clearly bounded UI region — a checkout widget, a navigation bar, an admin panel — along with the data fetching and state that belongs to it.

**Concrete mental model**

Think of an e-commerce site. The search team ships `search-app`, the cart team ships `cart-app`, the recommendations team ships `rec-app`. A thin shell loads whatever bundles are needed for the current route. The cart team can hotfix a payment bug and deploy at 2am without touching anything the search team owns. Users never notice a full-page reload.

**Where this matters in practice**

*Frontend:* You stop writing cross-team PRs for a shared monorepo. Each team gets its own CI pipeline, its own release cadence, and its own tech choices within reason (though shared design systems and framework versions reduce integration friction significantly).

*Fullstack:* Micro-frontends pair naturally with microservices. The checkout micro-frontend talks to the checkout service; the inventory widget talks to the inventory service. Ownership aligns vertically: one team owns the full stack for their domain, front to back.

*DevOps:* Each micro-frontend becomes its own deployable artifact. You get per-team deployment pipelines, independent rollback, and the ability to canary a single slice of the UI without gating on other teams. The cost is more infrastructure surface area — you're now coordinating CDN caching, CORS, and contract testing across multiple independently deployed assets.

**The real tradeoff**

Micro-frontends solve an organizational problem (team autonomy, parallel delivery) at the cost of technical complexity (shared state is hard, consistent UX requires discipline, debugging across bundle boundaries is painful). If you have one team, they're almost certainly wrong for you. If you have five teams blocked on each other in a UI monorepo, they start making sense.

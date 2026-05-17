---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Bounded Context

A bounded context is the explicit boundary around a domain model where its concepts, terms, and rules mean exactly one thing consistently. Without it, the word "Order" in your codebase could mean a shopping cart pending payment, a fulfilled shipment, or an accounting record — and the code quietly becomes incoherent.

### The Core Idea

The insight is that *ubiquitous language is local, not global*. Two teams can both use the word "Customer" and mean completely different things — billing cares about payment methods and invoicing history; support cares about tickets and communication preferences. Forcing a single `Customer` model to satisfy both creates a bloated, brittle object that's coherent to neither.

A bounded context says: define a boundary, give the model inside it a precise meaning, and treat crossing that boundary as an explicit integration point — not a shared database table or a god object passed around freely.

### Mental Model

Think of it like legal jurisdictions. "Contract" means something specific in civil law, something different in corporate law, and something else in employment law. A judge doesn't confuse them because they operate in separate jurisdictions. When jurisdictions interact, there's a formal translation layer (treaties, choice-of-law clauses). Bounded contexts work the same way — the translation happens at the boundary, not buried inside models.

### Concrete Example

An e-commerce platform has an `Order` in the checkout service (items, prices, discounts, payment intent) and an `Order` in the fulfillment service (warehouse location, shipping label, physical dimensions). These should be *separate models in separate contexts*, not one `Order` with 30 nullable fields. When checkout confirms payment, it publishes an event; fulfillment subscribes and creates its own representation. The boundary is the integration point.

### Practical Scenarios

**Backend (microservices):** You're designing service boundaries. Bounded context gives you the principled answer to "what goes in this service?" — not team size or deployment frequency, but cohesion of meaning. A context that spans two teams' definitions of a concept is a service boundary drawn wrong.

**Fullstack:** Your API models bleed into your frontend. The `User` returned from `/auth` has different shape than the `User` from `/profile` or `/admin`. Treating these as the same type (or fighting to make them the same) is a bounded context violation in your frontend. Separate view models per context, even if the backend leaks them.

### Why This Matters in Interviews and Design Discussions

Senior engineers recognize when disagreements about schema design are actually disagreements about context ownership. When someone says "but these two services share the same concept," the bounded context lens lets you ask: *do they really, or are we conflating two things that happen to share a name?* That reframe is often what unlocks a cleaner architecture.

It also sets up Anti-Corruption Layer thinking — once you acknowledge contexts are separate, you need principled strategies for translating between them without letting one context's model corrupt the other's.

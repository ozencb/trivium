---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Domain-Driven Design

DDD is the practice of building software whose structure mirrors the business domain it operates in — not the data it stores or the APIs it exposes. The driving insight is that misalignment between how developers think about the system and how business experts think about it is the root cause of most large-scale design failures.

### The Core Mechanism

DDD centers on a *ubiquitous language*: a shared vocabulary, developed collaboratively with domain experts, that appears identically in meetings, documentation, and code. Not "users table has a status column" but "`Order` transitions from `Pending` to `Fulfilled` when all `LineItems` are `Shipped`." When code reflects the domain language directly, domain experts can validate logic just by reading it, and developers stop maintaining a mental translation layer.

From that language, you derive your model. Entities are things with identity that change over time (`Order`, `Customer`). Value objects are things defined by their attributes, not identity (`Money`, `Address`). *Aggregates* are clusters of entities with a single root that enforces consistency — the boundary where invariants live. An `Order` aggregate owns its `LineItems`; you never mutate a `LineItem` directly, only through `Order`. This isn't just style — it's where transactional consistency boundaries get defined.

### The Concrete Tension

Consider "Account" in a fintech product. To billing, an account is a subscription with a payment method. To risk, it's a user with a fraud score. To support, it's a case history. DDD's answer is that these aren't the same concept with different views — they're different models in different *bounded contexts*. Forcing a single unified `Account` model to serve all three is what creates 800-line god objects and coupling between unrelated teams. Context boundaries are where you define what a word *means*, which is also where service or module boundaries often belong.

### In Practice

**Backend:** When designing a service, DDD forces the question "what does this system actually own?" before "what data does it need?" Aggregate boundaries tell you what goes in one transaction, which tells you which operations need to be atomic and which can be eventual. In interviews, being able to draw a context map and explain *why* two domains are separate (different rates of change, different teams, different invariants) distinguishes a systems thinker from someone who splits services by noun.

**Fullstack:** DDD prevents the frontend from becoming a thin wrapper around persistence. When your API surface reflects domain operations (`checkout`, `requestRefund`) rather than CRUD (`PUT /order`), frontend state management aligns with business events instead of database rows — less impedance mismatch, more explicit state transitions.

The failure mode DDD solves isn't technical debt in the usual sense. It's model debt: a codebase that works fine until a business rule changes, at which point changes ripple everywhere because the code never encoded *why* things were structured the way they were.

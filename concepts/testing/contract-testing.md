---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Contract Testing

Contract testing verifies that two services agree on their shared interface — the "contract" — without requiring both to run simultaneously. It exists because integration tests are expensive and brittle; contract tests give you confidence about service boundaries at unit-test speed.

### Core Mechanism

The key insight is separating two concerns that integration tests conflate:
- Does the **consumer** use the API correctly?
- Does the **provider** fulfill what the consumer needs?

You express this as a contract document — typically JSON — that captures specific interactions: "when the consumer calls `GET /orders/42`, the provider will respond with `{orderId, status, items}` shaped like this." Both sides test against this contract independently.

The dominant implementation is **Pact** (the tool + protocol). The flow:
1. Consumer writes a test against a local mock server. Running it generates a `.pact` file (the contract).
2. That file is published to a Pact Broker (a shared registry).
3. Provider runs its own verification test that replays the recorded interactions against the real provider code.

If the provider renames `items` to `lineItems`, step 3 fails — before anyone deploys anything.

This is *consumer-driven*: the consumer team defines what they need, and the provider team verifies they're meeting it. It inverts the usual dynamic where providers ship whatever they want and consumers adapt.

### Concrete Mental Model

Think of it like a typed interface, but enforced at runtime across a network boundary and owned by the consumer. It's the difference between "here's our API docs" and "here's a runnable spec of what we actually depend on."

### Practical Scenarios

**Backend (microservices):** Service A calls Service B's `/inventory` endpoint and expects `{available: boolean, count: number}`. Service B's team refactors and renames `available` to `inStock`. Without contract testing, this breaks in staging. With it, B's provider verification fails locally as soon as the change is made.

**Fullstack:** Your React app calls a BFF (backend-for-frontend). The frontend team writes Pact consumer tests that capture exactly what shapes they depend on. The backend team runs provider verification in CI. Teams stay decoupled — the frontend doesn't need a running backend for its tests, and the backend knows exactly what the frontend needs without reading frontend code.

### Comparison to What You Know

If you're familiar with property-based testing: PBT explores invariants *within* a component (for all valid inputs, this function behaves correctly). Contract testing explores invariants *at the boundary between components* (for these specific interactions, the provider and consumer agree). Both are about expressing expectations rigorously rather than testing by example.

The main gotcha: contracts only cover what the consumer actually uses, not the full provider API. A provider can break unused fields without failing contracts. That's a feature — you only care about breakage that affects real consumers — but it means contracts don't replace API documentation or schema validation.

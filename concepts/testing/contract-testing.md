---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Contract Testing

Contract testing is the practice of verifying service interactions against a shared specification — the "contract" — without requiring both services to be running simultaneously. It exists because integration tests that spin up full service meshes are slow, brittle, and block independent deployments.

**The core mechanism**

A contract is a recorded set of request/response pairs that a consumer (the caller) expects from a provider (the service). The process splits into two independent verification steps:

1. The **consumer** generates the contract by running its own tests against a mock provider. If those tests pass, it publishes the contract to a broker (like Pact Broker).
2. The **provider** fetches the contract and replays those recorded requests against itself, verifying its responses match what the consumer declared it needs.

Neither side needs the other deployed. The broker is the source of truth.

This is where the connection to property-based testing is worth noting: like PBT, contract testing shifts focus from "does this specific scenario work?" to "does this service satisfy the behavioral properties its consumers depend on?" The contract encodes the *properties* of the interaction, not just one snapshot.

**Concrete example**

Your `order-service` calls `user-service` to fetch a user's email and tier. In your consumer test, you define: "when I GET `/users/42`, I expect a 200 with `{ email: string, tier: 'free' | 'pro' }` in the body." That becomes the contract.

The `user-service` team can now refactor their database layer, rename internal fields, or upgrade their framework — as long as their provider verification passes against that contract, they can deploy independently. If they add a required field or change a response shape, the verification catches it before any deployment.

**Backend scenarios**

In microservice architectures, this is most valuable at service mesh boundaries where teams own different services. Without contract testing, you're either doing end-to-end tests that require full orchestration (slow, fragile), or you're hoping staging environments catch breaking changes (they don't, reliably). Contract tests give you a fast, decoupled signal in CI.

**Fullstack scenarios**

The frontend is a consumer too. If your React app calls `/api/dashboard/stats` and expects `{ totalRevenue: number, activeUsers: number }`, that expectation can be codified as a contract the BFF (backend-for-frontend) verifies. Frontend and backend teams can iterate independently without coordination overhead.

**Where it earns its keep**

Contract testing shines when you have explicit team boundaries and independently deployed services. It's overkill for a monolith or when you already have fast, reliable integration tests. The senior engineer instinct here is recognizing that contracts shift the *coordination cost* from runtime (production incidents) to development time (broker failures in CI) — and that trade-off is almost always worth it once you're operating across team boundaries.

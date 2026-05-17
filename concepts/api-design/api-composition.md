---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## API Composition Pattern

When a client needs a unified view of data that lives across multiple services — say, a user profile page that pulls from an auth service, a billing service, and an activity service — someone has to orchestrate those calls. API Composition moves that orchestration to the API layer (a gateway, BFF, or dedicated aggregation endpoint) rather than making the client do N sequential or parallel fetches itself.

**Core mechanism:** The composition layer receives a single client request, fans out to N downstream services (in parallel where possible), waits for responses, merges the results, and returns one response. The client sees a single round trip; the complexity of fan-out lives server-side where you have lower latency to your own services and better error handling primitives.

**Concrete model:** Think of it like a GraphQL resolver tree or a SQL `JOIN` — except instead of joining tables, you're joining service responses. A `/dashboard` endpoint might internally call `/users/{id}`, `/orders?userId={id}`, and `/notifications?userId={id}` concurrently, then shape the merged result into whatever the client actually needs.

**Where this really matters:**

*Backend:* You're building a BFF (Backend for Frontend) for a mobile app. Mobile has high latency, limited bandwidth, and users expect fast loads. Instead of the app making 4–6 calls on startup, you expose one `/home-feed` endpoint that composes everything. The BFF owns the fan-out, timeout handling, and partial failure strategy (return degraded data if the recommendations service is down, fail hard if auth is unreachable).

*Fullstack:* Your Next.js API route or tRPC procedure aggregates data from a user service, a CMS, and a feature flag service before rendering. You get a single data-fetch boundary, server-side caching opportunities, and a clean contract to the frontend that doesn't expose your internal service topology.

**The real pitfalls:**

- **Fan-out latency is the max of your slowest dependency**, not the sum — but only if you parallelize correctly. Accidentally serializing calls (await-in-loop) destroys the value.
- **Partial failures need an explicit strategy.** Return stale data? Return nulls? Fail the whole request? This decision belongs in your API contract, not as an afterthought in error handling.
- **Composition layers become data-shape owners.** They tend to accumulate transformation logic and become hard to reason about over time. Keep them thin — compose and reshape, don't add business logic.
- **You're coupling the composition layer's availability to N services.** Blast radius of a single aggregation endpoint is wide. Circuit breakers and fallbacks matter.

Reach for this when clients are chatty, when you're fronting a mobile or low-bandwidth surface, or when you're building a BFF that owns a specific product surface. Avoid it when services have very different SLAs — you'll end up bounding your fast path by your slow one.

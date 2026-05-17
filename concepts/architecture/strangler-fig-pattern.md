---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Strangler Fig Pattern

The Strangler Fig gets its name from a tropical plant that grows around a host tree, slowly enveloping it until the original tree dies and the fig stands on its own. Applied to software, it's the safest known approach for replacing a system that can't afford downtime and can't be rewritten all at once.

**Core mechanism**

The key is interception. You place a proxy (often your API gateway) in front of the legacy system. New requests for migrated functionality get routed to the new implementation; everything else falls through to the legacy system. Over time, you shift more traffic until nothing reaches the old system and you can delete it.

This differs from a "big bang" rewrite in one critical way: the legacy system stays live and correct the entire time. You're never in a state where the new system has to be complete before users are unblocked.

**Concrete model**

Imagine a monolith handling `/users`, `/orders`, and `/payments`. You build a new Orders Service first. Behind the gateway, you add a routing rule: `GET/POST /orders/*` → new service, everything else → monolith. The monolith still exists, still handles users and payments, and nobody notices the migration is happening. Once orders are proven stable, you repeat for payments, then users. When the last route moves, you delete the monolith.

**Backend relevance**

The pattern forces you to define clear seams in your existing system — which is genuinely hard. Legacy code often has implicit shared state (global DB transactions, shared caches, in-process events) that only becomes visible when you try to extract a piece. This is where most strangler migrations stall: engineers underestimate coupling. The fix is to route at the boundary but keep the data synchronized temporarily (dual-writes or CDC) until the new service fully owns its domain.

**DevOps relevance**

You're already familiar with blue-green deployments for releasing safely. Strangler Fig is the same risk-management philosophy applied at architectural scale. Feature flags, canary routing, and traffic shadowing are all tools you can layer into a strangler migration — progressively shifting traffic and rolling back individual routes without touching the rest of the system. Observability matters more here than in most patterns: you need side-by-side metrics from old and new to confidently cut over.

**Where it differentiates senior engineers**

Junior engineers treat legacy rewrites as binary: "we're doing a new system." Seniors recognize that the delivery risk is almost always in the transition, not the new code itself. Proposing a strangler approach in a design discussion signals you understand operational continuity, incremental value delivery, and the true cost of coupling — which is exactly what staff-level conversations are about.

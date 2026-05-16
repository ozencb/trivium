---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

An API gateway is a single entry point that sits in front of your backend services and handles cross-cutting concerns — auth, rate limiting, routing, logging — so individual services don't each have to implement them. It's the pattern that makes microservices practical at scale.

## Core mechanism

The gateway receives every inbound request, applies a policy pipeline (authenticate → authorize → rate limit → route → transform → log), then proxies the request to whichever upstream service owns it. Responses come back through the same pipeline where they can be transformed, cached, or aggregated before reaching the client.

The key insight is **shared infrastructure at the edge**. Without a gateway, every service implements auth independently — that's both duplication and a consistency risk. With a gateway, auth is solved once. Services trust that if a request arrived, the gateway already validated it; they receive identity via headers (e.g., `X-User-Id: 42`) and don't touch tokens at all.

## Concrete mental model

Think of it as a building's security desk. Visitors don't wander directly to individual offices — they check in at the front, show ID, get a badge, and are routed to the right floor. The people upstairs never need to verify who you are; they just see that you made it past security.

## Practical scenarios

**Backend:** You have five microservices. Rather than each service validating JWTs, the gateway validates once and passes `X-User-Id` / `X-Roles` headers downstream. Services become simpler and independently testable. Rotating auth schemes (say, moving from JWT to opaque tokens) is a one-place change.

**Fullstack:** Your frontend calls `/api/v1/*`. The gateway routes based on path prefix — `/users/*` goes to the user service, `/payments/*` to the billing service. You can split a monolith into services, or merge two services, without changing any client code. CORS, SSL termination, and request normalization all happen here so no individual service handles them.

**DevOps:** Canary deployments become a gateway config change — route 5% of traffic to `users-service-v2`. You control the traffic split without touching either service. Centralized request logs mean one Grafana dashboard covers your entire API surface instead of aggregating across ten services.

## What to watch for

Gateways can become a bottleneck or single point of failure — run them clustered with proper health checks. Also understand the gateway vs. service mesh distinction: gateways handle north-south traffic (client → services), service meshes like Istio handle east-west (service → service). You often use both. The **BFF pattern** (Backend for Frontend) extends this further — a dedicated gateway per client type (mobile, web, internal) so each gets a tailored API surface without polluting the core services.

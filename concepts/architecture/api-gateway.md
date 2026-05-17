---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

An API Gateway is a reverse proxy that sits at the perimeter of your system and absorbs every concern that has nothing to do with business logic: authentication, rate limiting, TLS termination, request routing, logging, and tracing. The payoff is that your downstream services stay focused on their domain — no auth middleware duplicated across six services, no per-service rate limiter configs drifting out of sync.

**Core mechanism**

The gateway intercepts every inbound request before it reaches any service. It evaluates a pipeline of policies — validate the JWT, check the rate limit bucket, resolve the route, forward the request, capture the response latency — then proxies the request downstream. The key insight is that these policies are stateless transformations on the request/response, so they compose cleanly and stay independent of service code.

Routing is where it gets interesting. Gateways can route by path prefix (`/users` → user-service), by HTTP verb, by header value, or by arbitrary predicates. This enables patterns like traffic splitting (10% of `/search` to the experimental ranking service), request shadowing (clone prod traffic to staging), and version routing (`Accept: application/vnd.api+json;version=2` to v2 service).

**Mental model**

Think of it as a bouncer plus a switchboard at a hotel. The bouncer checks credentials once at the door; inside, the switchboard connects you to the right room. Neither the rooms nor the guests need to know about each other's existence — only the switchboard does.

**Practical scenarios**

*Backend*: You're building a microservices platform. Without a gateway, every service reimplements auth token validation. The bug surface is multiplied by the number of services. Put the JWT validation at the gateway, pass a validated identity header downstream (`X-User-Id`, `X-Roles`), and services trust the header — no token parsing in service code.

*Fullstack*: Your frontend talks to five backend services. CORS is a mess, each service exposes different base URLs, and the client-side bundle has to manage five different auth headers. A gateway unifies them behind a single origin and handles CORS in one place. BFF (Backend for Frontend) patterns are often implemented at the gateway layer.

*DevOps*: Canary deployments without touching service code. Configure the gateway to route 5% of traffic to the new deployment, monitor error rates and latency, then gradually shift weight. If it goes wrong, flip it back at the gateway — no rollback needed in the service.

**Where engineers get it wrong**

The common mistake is letting the gateway accumulate business logic: "let's do input validation here," "let's transform the response here." The moment the gateway knows what a `userId` means, it's no longer infrastructure — it's a liability. Keep the gateway dumb about domain semantics. If you need aggregation or transformation per-client, that's a BFF layer, not the gateway itself.

In system design interviews, the senior signal is knowing *when not to use* one — a monolith with one client doesn't need a gateway, it needs good middleware. The gateway earns its keep when you have multiple services or multiple client types.

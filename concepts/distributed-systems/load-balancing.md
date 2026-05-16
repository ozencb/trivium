---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Load balancing is the practice of distributing incoming requests across multiple backend instances so no single server becomes the bottleneck — it's what makes horizontal scaling actually work rather than just being a theoretical option.

## The Core Mechanism

A load balancer sits between clients and your server pool, and its job is deceptively simple: receive a request, pick a backend, forward it. The interesting part is the *picking*. The naive approach is round-robin — distribute evenly in sequence. But round-robin assumes all requests are equal and all servers are equally healthy, which is rarely true.

More sophisticated strategies include:

- **Least connections**: route to the server with fewest active connections — better when request duration varies significantly
- **Weighted round-robin**: assign traffic proportionally (e.g., a beefier instance gets 3x the traffic of a smaller one)
- **IP/session hash**: deterministically route a client to the same backend, preserving stateful sessions without shared state
- **Random with two choices (P2C)**: pick two servers at random, route to the less-loaded one — surprisingly effective at avoiding hot spots

Health checks run continuously in the background. When a backend fails its check, the load balancer removes it from the pool and redistributes its share. This is where the "balancing" becomes "resilience."

## Concrete Mental Model

Think of it like a phone bank. Calls come in to one number; a dispatcher routes each call to an available agent. The dispatcher tracks who's busy, pulls sick agents off the queue, and can weight calls toward senior agents for complex issues. The caller doesn't know or care which agent answers.

## Practical Connections

**Backend**: You're adding a second API server to handle traffic growth. Without a load balancer, you'd need clients to know about both servers. With one, the fleet is invisible — you can add or remove instances without touching client config.

**SRE**: Load balancers are a critical observability point. Metrics like request rate, error rate, and latency per backend let you catch a degraded instance before users flood your on-call. Canary deployments work by routing a small percentage of traffic to the new version via the balancer's weighting rules.

**DevOps**: In Kubernetes, `Service` objects are a load balancer abstraction — kube-proxy handles the actual routing across pod IPs. Cloud load balancers (ALB, GCP LB) handle TLS termination, so backends don't need to.

**Fullstack**: Session affinity (sticky sessions) is the escape hatch when you can't externalize session state. The load balancer hashes on a cookie and pins that user to one backend. It works, but it defeats horizontal scaling — use it as a temporary measure while you move session state to Redis.

## Why This Unlocks Service Mesh

Once you understand load balancing at the infrastructure level, service mesh makes sense: it moves the load balancing logic into the application layer (sidecar proxies), enabling fine-grained per-service policies, mTLS between services, and circuit breaking — without touching application code.

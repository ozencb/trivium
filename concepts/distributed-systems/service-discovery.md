---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Service Discovery

In a dynamic fleet, instance IPs change constantly — containers restart, nodes scale, deployments roll. Service discovery solves the fundamental problem: how does Service A find Service B when B's address isn't stable? The answer is a shared registry that services write to on startup and read from on connection, with the infrastructure absorbing the churn so callers don't have to.

### Core Mechanism

There are two primary patterns:

**Client-side discovery**: The caller queries the registry directly (e.g., Consul, etcd, ZooKeeper), gets a list of healthy instances, and load-balances itself. Netflix's Eureka works this way. The client is smarter but coupled to the registry's API.

**Server-side discovery**: The caller hits a stable endpoint (a load balancer or DNS name), and the routing layer does the registry lookup. The caller stays dumb. AWS ALB + ECS service discovery works this way — you call `http://payments.internal`, and the load balancer resolves that to a live instance.

**DNS-based discovery** sits in between: services register SRV records, and callers use standard DNS TTLs to pick up changes. It's infrastructure-native and language-agnostic, but TTL-based cache expiry means stale entries linger. Kubernetes uses this heavily — every Service gets a stable DNS name, and kube-dns/CoreDNS resolves it to the ClusterIP, which then routes to healthy pods.

**Sidecar-based discovery** (the Envoy/service mesh model) offloads both registration and resolution to a proxy running alongside each instance. Your app code becomes completely unaware — it dials localhost, the sidecar intercepts, resolves, and routes. This is what Istio/Linkerd give you.

### Mental Model

Think of it like a whiteboard in a shared office. When you arrive, you write your name and desk number. When someone needs you, they check the board — not a months-old org chart. The health check system is the person who erases names when someone goes home.

### Practical Implications

**Backend**: When designing inter-service calls, hardcoding hostnames is a red flag. The question to ask is: "what's the failure mode when that IP is gone in 30 seconds?" If you can't answer it, you don't have discovery — you have hope.

**SRE**: Most "service is down" incidents during deployments are actually discovery lag — old instances deregistered before new ones are healthy, or health check TTLs too long. Tuning registration TTL, health check interval, and deregistration delay is where reliability actually lives.

**DevOps**: In Kubernetes, understanding that `Service` is a discovery abstraction (not just load balancing) changes how you reason about networking. A `ClusterIP` Service is stable across pod restarts — the pods are ephemeral, the Service is not.

### The Senior Engineer Differentiator

The question that separates candidates in system design: "what happens during a network partition between your service and the registry?" Client-side discovery fails open (stale data) or closed (no data) depending on implementation. Server-side discovery shifts that problem to your load balancer. Neither is wrong — but knowing which failure mode you're choosing shows you understand the tradeoffs, not just the happy path.

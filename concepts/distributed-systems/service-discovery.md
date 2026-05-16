---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Service Discovery** is the mechanism by which services in a distributed system locate each other at runtime, without hardcoded addresses — because in dynamic infrastructure, IPs and ports change constantly and you can't bake them into config.

## Core Mechanism

There are two models:

**Client-side discovery**: The calling service queries a registry (e.g., Consul, etcd) directly, gets a list of healthy instances, picks one, and connects. The client owns load balancing logic.

**Server-side discovery**: The client sends requests to a stable endpoint (a load balancer or proxy), which queries the registry and forwards traffic. The client is ignorant of topology.

Both depend on a **service registry** — a strongly consistent (or eventually consistent) key-value store where services register themselves on startup and deregister on shutdown. Health checks (TTL-based or active probes) evict dead instances. Since you already know consensus algorithms, it's worth noting that registries like Consul use Raft to keep member state consistent across registry nodes — you need agreement on "who's alive" or split-brain causes routing chaos.

## Concrete Mental Model

Think of it like DNS, but with a TTL of seconds instead of hours, and with health awareness baked in. Regular DNS tells you *where something was*. A service registry tells you *where something healthy is right now*. The lookup is just: "give me current healthy instances of `payments-service`" and the registry returns `[10.0.1.5:8080, 10.0.1.12:8080]`.

Kubernetes extends this further — every Pod gets registered automatically via the control plane, and `kube-proxy` + CoreDNS handle discovery transparently. You query `payments-service.prod.svc.cluster.local` and Kubernetes resolves it to healthy pod IPs, managing registration/deregistration as pods come and go.

## Practical Scenarios

**Backend**: When your API gateway calls `order-service`, it resolves via Consul or Kubernetes DNS rather than a config file. Rolling deployments don't require restarting the caller — the registry drains old instances and registers new ones.

**SRE**: Service discovery is where you implement circuit breaking and health-gate logic. If 3 of 5 instances fail their health checks, the registry stops advertising them before a human pages you. Debugging "why did traffic drop to zero?" often starts with "what does the registry show for that service right now?"

**DevOps**: In Terraform/Helm-managed infrastructure, auto-scaling groups register new nodes on boot. Discovery lets you scale horizontally without touching any application config. It's also the prerequisite for canary deployments — you register the canary at 10% weight, observe, then shift traffic by updating registry metadata.

---

This is the foundation under **Service Mesh** — a mesh like Istio or Linkerd is essentially automated client-side discovery + mTLS + observability, where the sidecar proxy handles registry queries so your application code doesn't have to.

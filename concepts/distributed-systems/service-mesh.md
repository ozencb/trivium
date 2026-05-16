---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Service Mesh

A service mesh is an infrastructure layer that handles service-to-service communication concerns — retries, timeouts, circuit breaking, mTLS, observability — without touching application code. The motivation: in a microservices system, these cross-cutting concerns get duplicated across every service in every language if left to application teams.

### Core Mechanism

The canonical implementation is the **sidecar proxy pattern**. Every service instance gets a lightweight proxy (typically Envoy) injected alongside it. All inbound and outbound traffic flows through this proxy — the application believes it's talking directly to another service, but the proxy silently intercepts everything. A **control plane** (e.g., Istio's `istiod`) pushes config to all these proxies centrally: routing rules, retry policies, mTLS certificates, traffic weights.

This is architecturally distinct from an API gateway. Gateways handle north-south traffic (external client → service). A mesh handles east-west traffic (service → service). Both can coexist.

### Mental Model

Each service has a dedicated operator (sidecar) who handles every call it makes and receives. The operators follow a central rulebook (control plane config). Your services just dial numbers — retry logic, encryption, and routing are invisible to them. The operators handle it transparently.

### Practical Scenarios

**SRE:** Latency spike between Service A and B. Without a mesh, you're tailing logs across two codebases and hoping someone instrumented their HTTP client. With a mesh, the proxy layer automatically emits distributed traces and golden signal metrics — no code changes. Circuit breaker tripped? It shows up in your observability tooling, not buried in application logs.

**DevOps:** Canary deploy — shift 5% of traffic to a new version. In a mesh, you define a traffic split in a `VirtualService` or equivalent policy object. No load balancer reconfiguration, no feature flag in application code. Traffic shift and rollback are config changes, not deployments.

**Backend:** Compliance requires mTLS between services. Without a mesh, every team implements it differently, cert rotation is manual, and debugging cert failures requires deep app knowledge. With a mesh, mTLS is enforced at the proxy — your service speaks plain HTTP internally, the sidecar handles encryption and automatic cert rotation via the control plane.

### The Real Tradeoff

Meshes add latency (two extra network hops per request — out through your proxy, into theirs) and meaningful operational complexity. The control plane is a new failure domain you're now responsible for. At 5–10 services, the overhead rarely justifies it. At 50+ services with cross-team ownership, the centralized observability and policy enforcement start earning their keep.

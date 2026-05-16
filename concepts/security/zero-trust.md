---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Zero-Trust Networking

Zero-trust is a security model that eliminates implicit trust based on network location — every request must be authenticated and authorized regardless of where it originates, including requests from inside your own network.

### The Core Idea

Traditional perimeter security assumes: if traffic is inside the firewall, it's probably legitimate. Zero-trust rejects this entirely. The model treats every request as potentially hostile until proven otherwise, regardless of whether it comes from the public internet, a corporate VPN, or a Kubernetes pod on the same node as the target service.

The mechanism rests on three pillars:

1. **Strong identity on every request.** Each workload, user, and device has a cryptographic identity. This is where mTLS comes in — your service mesh issues short-lived certificates to each workload, so `payments-service` can prove to `orders-service` that it actually is the payments service, not something that somehow got onto the network.

2. **Authorization is per-request, not per-connection.** Even after a service proves its identity, each request is checked against an authorization policy: *can this identity perform this action on this resource, given current context?* Context can include time of day, device posture, or anomaly signals.

3. **Least-privilege by default.** Services and users get exactly the access they need, nothing more. Lateral movement after a compromise is contained — owning `logging-service` shouldn't grant any access to the payments database.

### Mental Model

Think of it like a hospital. Even if someone is wearing scrubs and clearly works there, they still need to badge into the ICU. Being physically inside the building isn't the credential — the badge is. And the badge might only work for certain doors during certain shifts.

### Practical Scenarios

**SRE:** When a service starts making unusual outbound calls — say, your reporting service suddenly querying the auth DB directly — a zero-trust system can detect identity anomalies and kill that connection. Blast radius containment becomes architectural, not just incident-response.

**DevOps:** Zero-trust shapes how you build CI/CD pipelines. Instead of giving your deployment runner broad IAM permissions because it runs "inside" the VPC, you issue it a short-lived workload identity with exactly the permissions needed for that deploy, scoped to that environment, expiring in minutes.

**Backend:** Service-to-service calls can't rely on network ACLs or IP allowlists alone. With a service mesh doing mTLS and policy enforcement, your `users-service` can declare: "only `auth-service` and `api-gateway` may call my `/internal/profile` endpoint" — and that policy is enforced cryptographically, not by firewall rules that drift over time.

Zero-trust doesn't mean paranoia — it means moving trust decisions out of network topology and into explicit, auditable, cryptographically verified policies.

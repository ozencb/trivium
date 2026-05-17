---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Platform Engineering

Platform engineering is the discipline of building internal developer platforms (IDPs) — opinionated, self-service systems that abstract infrastructure complexity away from product teams. The goal isn't to automate ops tasks; it's to shift the unit of delivery from "infrastructure configuration" to "product capability," so a developer can go from idea to production without filing tickets or learning Kubernetes internals.

### The Core Mechanism

The key insight is the **golden path**: a curated, opinionated workflow that encodes your org's best practices into defaults. When a team follows the golden path, they get networking, observability, secrets management, scaling policies, and deployment pipelines baked in — correctly configured — without understanding any of it. The platform team owns that complexity once; every product team benefits perpetually.

This is implemented through a **control plane abstraction**. Rather than exposing raw Terraform or raw Kubernetes manifests, you expose higher-level primitives: "give me a web service with these resource limits and this SLO target." Backstage, Humanitec, and custom internal portals are common surfaces. Behind them: Crossplane or Terraform modules generating real infrastructure, ArgoCD syncing state, and policy-as-code (OPA/Kyverno) enforcing guardrails.

The mental model: think of it as an API for your infrastructure. Product teams are API consumers. Platform engineers are API designers. The API surface is deliberately narrow — it hides degrees of freedom that would otherwise produce inconsistent, hard-to-support configurations across hundreds of services.

### Practical Scenarios

**For DevOps:** Platform engineering is where you stop writing one-off Terraform for each team and start building reusable modules wrapped in a service catalog. The shift is from "infrastructure ticket handler" to "platform product owner." The hard part isn't the tooling — it's deciding what to expose and what to hide. Over-abstracting kills flexibility; under-abstracting just moves the problem.

**For SRE:** The platform is how you scale reliability practices across a large org without a 1:1 staffing ratio. When observability (traces, metrics, dashboards) and alerting templates are baked into the golden path, every new service inherits them automatically. Incident patterns become systemic fixes in the platform rather than tribal knowledge. The flip side: the platform itself becomes a blast-radius risk — a bad platform release can degrade every team simultaneously.

### Where Engineers Get This Wrong

The most common failure is treating the platform team as an infrastructure team with a nicer UI. If product teams can't self-serve — if they're still filing tickets to get something deployed — the platform hasn't solved the problem. The measure of success is **cognitive load reduction**, not feature count.

In design discussions and interviews, the differentiator is understanding the tradeoff between paved paths and escape hatches: you need golden paths to be fast, but you need documented off-ramp mechanisms for the 20% of use cases the platform doesn't cover. Without escape hatches, you're just building a new kind of bureaucracy.

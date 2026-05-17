---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Canary Releases

Where blue-green swaps 100% of traffic atomically, a canary release is deliberate gradualism: you route a small percentage of real traffic to the new version while the old version continues serving the majority. The name comes from coal mining — canaries detected gas before it killed miners. The idea: let a small, real user slice expose problems before they affect everyone.

**The core mechanism**

The new version runs alongside the old one simultaneously. A load balancer (or service mesh, or feature flag system) routes a configurable slice — typically 1%, 5%, 10% — to the new deployment. You watch error rates, latency percentiles, and business metrics on that slice. If the canary looks healthy after some soak time, you shift more traffic. If it degrades, you route everything back to the stable version and investigate. No user-facing rollback page, no incident — just a config change.

The hard part isn't routing traffic; it's defining what "healthy" means. A canary that silently returns wrong data but returns it fast will pass naive error-rate checks. Good canary analysis requires golden signals at minimum, ideally automated promotion/rollback gates that evaluate multiple signals in combination.

**Concrete example**

You're deploying a query optimization to your search service. You can't reproduce production load patterns in staging. You cut 5% of search traffic to the new version. Your SLO is p99 latency < 200ms. At the 5% slice, you see p99 drift to 240ms — something the optimization does poorly under real concurrency. You rollback before any SLO violation registers for real users. Without canary, that's an incident.

**Where it matters in practice**

- **SRE/DevOps**: Canary gates become part of your CD pipeline. Tools like Argo Rollouts or Spinnaker can automate promotion decisions based on Prometheus queries. The interesting design question is how to handle stateful services — if your canary handles a user's first request, do they get routed back to stable on the next?

- **Backend**: Database schema changes are the classic canary trap. If the new code writes data in a format the old code can't read, rolling back breaks the users the canary already touched. This forces you to think in terms of expand/contract migrations: always keep the old code readable before promoting new writes.

- **Senior differentiation**: In a design review, knowing to ask "what's your canary blast radius if the DB migration isn't backward-compatible?" immediately signals you've been burned before. Most engineers think about canary as a traffic management problem; experienced engineers know it's a data compatibility problem in disguise.

Canary releases set the stage for feature flags — where you push a deployment fully but gate behavior on a per-user or cohort basis rather than at the infrastructure layer. Same risk-reduction philosophy, different lever.

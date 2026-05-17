---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Attribute-Based Access Control (ABAC)

RBAC asks "what role does this user have?" ABAC asks "what is true about this user, this resource, and this moment?" That shift from identity to predicate evaluation is what makes ABAC expressive enough for real-world authorization complexity — and what makes it worth understanding when RBAC starts feeling like duct tape.

**The core mechanism**

ABAC evaluates policies as boolean expressions over attribute sets. Every access decision takes three inputs: subject attributes (user department, clearance level, employment status), resource attributes (document classification, owner, project tag), and environment attributes (time of day, IP range, geo-region). A policy engine — often following the XACML model or a simpler custom DSL — evaluates rules against this context and returns Permit or Deny.

The key insight: attributes are data, so authorization becomes a query rather than a lookup. Instead of "is user in role `doc-editor`?", you evaluate "does `user.department == doc.department AND user.clearance >= doc.classification AND env.time in working_hours`?". That's three RBAC roles collapsed into one policy rule.

**A concrete model**

Think of ABAC like a SQL WHERE clause for permissions. Your policy is the query, attributes are the columns, and the authorization engine runs the evaluation. When requirements change — say, "contractors can only access resources their sponsor created, and only during business hours in their timezone" — you update the policy expression, not the role matrix.

**For backend engineers**

ABAC becomes necessary when row-level or field-level authorization logic starts leaking into service code. If you're writing `if user.team_id == document.team_id` scattered across handlers, you've already implemented informal ABAC — badly. A proper ABAC system centralizes that logic in a policy engine (OPA, Cedar, Casbin) that services call at decision points. The tradeoff: you're now maintaining a policy language alongside your application code, which is a real operational burden.

Integration usually means adding a PDP (Policy Decision Point) sidecar or library and ensuring attribute data is available at request time — often via enriched JWTs or a fast attribute store. The hard part is attribute freshness: a revoked clearance needs to propagate before the next request, not the next token refresh.

**For SREs**

ABAC is increasingly relevant for infrastructure authorization — think: which engineers can run commands on which hosts, based on their on-call schedule, the host's criticality tier, and the current incident severity. Tools like AWS IAM condition keys and GCP IAM conditions are ABAC in production. When you're writing IAM policies with `aws:RequestedRegion` or `resource-tag/Environment` conditions, you're already using it.

The operational concern is observability: when an access denial happens, debugging requires knowing which attribute failed evaluation, not just "denied." Policy engines that emit structured decision logs with attribute snapshots are essential for this.

**Where it differentiates**

Knowing RBAC is table stakes. Being able to articulate *when* RBAC breaks down — combinatorial role explosion, inability to express context-dependent rules, authorization logic bleeding into application code — and proposing ABAC with awareness of its policy management cost is what reads as senior thinking in a system design conversation.

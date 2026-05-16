---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Attribute-Based Access Control (ABAC)

ABAC is an authorization model where access decisions are made by evaluating arbitrary attributes of the subject, resource, action, and environment — rather than checking membership in a role. It's what you reach for when RBAC's coarse-grained assignments start generating combinatorial role explosion.

### Core Mechanism

In RBAC, you ask: *does this user have role X?* In ABAC, you evaluate a **policy** against a set of attributes, and the policy is a logical expression that can reference any of them:

- **Subject attributes**: `user.department = "engineering"`, `user.clearance_level = 3`
- **Resource attributes**: `document.classification = "confidential"`, `document.owner = user.id`
- **Action**: `read`, `write`, `delete`
- **Environment attributes**: `request.time < 18:00`, `request.ip in corporate_ranges`

A policy might say: *"Allow write if the user's department matches the resource's owning department AND the request comes from within the corporate network."* No role can express that cleanly — especially the dynamic parts like ownership matching or time-of-day constraints.

The policy engine (often following the XACML or Rego/OPA model) evaluates these policies at request time against the current attribute values. The key insight is that attributes are **resolved dynamically**, so the same user can have different access to different resources without any explicit per-resource assignment.

### Concrete Example

You have a document management system. With RBAC, you might create roles like `engineering-doc-editor`, `finance-doc-viewer`, etc. — and immediately hit trouble when a finance user needs to edit only *their own* documents, or when a contractor needs read access only during their engagement period.

With ABAC:
```
allow if:
  user.department == document.department AND action == "write"
  OR user.id == document.created_by AND action IN ["write", "delete"]
  OR user.role == "admin"
```

One policy handles department-scoped writes, owner-specific deletes, and admin override — no new roles needed.

### Practical Scenarios

**Backend**: Multi-tenant SaaS where a user can edit records they own, managers can edit records in their team, and admins can edit anything. ABAC lets you encode this in a single policy file (OPA/Rego is common here) rather than scattering `if user.is_owner or user.is_manager` logic across service handlers. The policy becomes auditable and testable independently.

**SRE**: Environment-scoped access to infrastructure. Attributes like `environment=production`, `resource.criticality=high`, or `incident.active=true` can gate who can run destructive commands. You can enforce "only on-call engineers can restart production services, and only during an active incident" without creating a `production-on-call-incident-restarter` role that someone inevitably leaves permanently assigned.

### RBAC vs ABAC

RBAC is simpler to reason about and audit when access patterns are stable and coarse-grained. ABAC adds power but also complexity — policy debugging and attribute trust boundaries become real concerns. Many systems use both: roles as one attribute among many, not the sole axis of control.

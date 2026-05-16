---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Role-Based Access Control (RBAC)

RBAC is a permission model where access is granted to **roles**, not directly to users — users then inherit permissions by being assigned to roles. It exists because at scale, managing per-user permissions becomes unworkable; roles let you express access policy at a human-organizational level.

### Core Mechanism

The model has three primitives: **users**, **roles**, and **permissions**. Permissions are atomic capabilities (`invoice:read`, `invoice:write`, `user:delete`). Roles are named collections of permissions (`billing-admin`, `support-agent`, `read-only`). Users are assigned roles, not permissions directly.

The key insight is that roles model **job functions**, not individuals. When someone changes jobs, you change their role assignment — not 47 individual permission toggles. When compliance requires auditing who can delete data, you inspect a role definition, not a per-user matrix.

Most production implementations add one more concept: **role hierarchy**. A `super-admin` role implicitly includes everything `admin` includes, which includes everything `viewer` includes. This lets you express inheritance rather than duplicating permission lists.

### Concrete Mental Model

Think of it like an apartment building's key system. The building doesn't give each tenant a unique custom key cut per door they're allowed to open. Instead, they issue keycards by type: "resident" opens lobby + elevators + their floor; "maintenance" opens utility rooms + all floors; "management" opens everything. Adding a new tenant = assign a keycard type. The doors don't change. The tenant doesn't change. Just the mapping.

### Practical Scenarios

**Backend:** Your API middleware checks `req.user.roles` against a required role before hitting the route handler. Easier pattern: attach resolved permissions to the request context at auth time so downstream code checks `can('invoice:write')` — this decouples routes from knowing role names, making refactors cheaper.

**Fullstack:** The frontend uses roles to conditionally render UI (hide the "Delete User" button for `support-agent`), but never trusts this as security — it's UX only. The real enforcement lives in the API. A common mistake is diverging these two, leading to confusing states where buttons disappear but API calls still succeed (or vice versa).

**SRE:** RBAC governs infrastructure access. Cloud IAM (AWS, GCP) is RBAC-flavored: service accounts get roles that bundle permissions to specific resource types. When on-call needs emergency write access to production, they're temporarily assigned an elevated role — auditable, time-bounded, reversible — rather than getting raw credentials.

### Why This Matters for What Comes Next

RBAC works until your access rules depend on **context** beyond identity: "can edit this document, but only if they own it" or "can approve requests under $10k but not over." That's where RBAC hits its ceiling, and Attribute-Based Access Control (ABAC) picks up — it adds the resource's own attributes and environmental context into the decision.

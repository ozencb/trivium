---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Role-Based Access Control (RBAC)

RBAC decouples permissions from users by introducing roles as an intermediary — users are assigned roles, and roles carry permissions. The key insight is that you're managing policy at the role level, so when a permission changes, you update one role and every user in it gets the change automatically.

### The Core Mechanism

The data model is three entities and two join tables: `users`, `roles`, `permissions`, with `user_roles` and `role_permissions` bridging them. A permission check becomes: "does any role assigned to this user have permission X?" At enforcement time, you either compute this on the fly (DB join) or materialize it into a token — which is exactly what OAuth 2.0's `scope` field or JWT `roles` claim does. The authorization server bakes the role set into the token at issuance; your resource servers don't need to hit a database on every request.

### Concrete Mental Model

Think of a hospital: instead of granting Dr. Smith access to prescriptions, billing records, and lab results individually, you assign the `attending-physician` role. When regulations change what attendings can see, you update the role once. Contrast this with assigning permissions directly to each of 500 physicians — that's the mess RBAC avoids.

### Where It Gets Tricky

Role explosion is the classic failure mode. Systems start with `admin`, `editor`, `viewer`, then accumulate `regional-admin`, `read-only-billing`, `temp-contractor` until nobody knows what a role actually grants. The other pitfall is treating roles as groups (a social concept) rather than permission bundles (a policy concept) — they often diverge and cause confusion.

Privilege creep is subtler: users accumulate roles over time without pruning, especially after job changes. An RBAC system without role revocation audits isn't actually enforcing least privilege.

### Practical Scenarios

**Backend**: Middleware checks JWT claims for a role, gates the route. Simple, stateless, fast. Problem arises when you need "user can edit *their own* posts but not others'" — that's row-level, not role-level, and RBAC can't express it cleanly without hacking in special roles.

**Fullstack**: Frontend conditionally renders UI based on roles from the token. Common mistake: treating this as a security boundary. It's UX, not enforcement — the API must still validate on every request.

**SRE**: RBAC governs cloud IAM (AWS IAM roles, GCP service accounts). The discipline here is assuming roles at runtime (e.g., EC2 instance profile) rather than embedding static credentials — same RBAC concept applied to service identity.

### Why This Matters in Interviews/Design

The senior move is knowing when RBAC breaks down. When you hear "access depends on the resource's attributes, the user's department, time of day" — that's the signal to reach for ABAC. RBAC is a prerequisite mental model for ABAC: ABAC generalizes roles into arbitrary attributes and policies evaluated at request time, trading simplicity for expressiveness.

---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Secrets Rotation

Secrets rotation is the practice of replacing live credentials on a schedule—before they're compromised—and propagating the new values to all consumers without downtime. The goal isn't compliance theater; it's limiting the window of exposure: a rotated credential caps how long a leaked secret remains useful to an attacker.

### The Core Problem: The Transition Gap

Naive rotation breaks things. The sequence "generate new → update consumers → revoke old" has a gap where the service holds the old credential but the backend has already rejected it. The correct pattern is **dual-active**: generate the new secret, register it alongside the old one (so both are valid), push the new one to consumers, *then* revoke the old. That overlap window—seconds to minutes—is where the real coordination lives.

AWS Secrets Manager, Vault, and GCP Secret Manager all implement this with versioned secrets. SM, for instance, tracks `AWSCURRENT` and `AWSPREVIOUS` simultaneously, giving rotation lambdas room to test new credentials before retiring old ones.

### Concrete Example: RDS Password Rotation

1. Rotation trigger fires (scheduled or manual)
2. Lambda creates a new password, stores it as a pending version in Secrets Manager
3. Lambda sets the new password on the RDS user—both old and new are now valid DB credentials
4. Lambda validates the new credential against the DB
5. SM promotes the new version to `AWSCURRENT`; old becomes `AWSPREVIOUS` briefly
6. Next rotation cycle fully revokes `AWSPREVIOUS`

The application doesn't need to know any of this happened—if it gets a 401/auth failure, it re-fetches the secret and retries. This **rotation-aware retry** pattern is the coupling point you need to build into your secret-fetching layer.

### Practical Scenarios

**Backend**: The most common pitfall is in-memory credential caching with no TTL. Rotation pushes a new secret to the store, but your running process never picks it up. Always TTL your cached credentials, or hook into rotation events to invalidate.

**DevOps**: CI/CD pipeline secrets (deployment keys, registry credentials) are higher-value targets than most internal service creds—they touch more systems and appear in more contexts. These warrant shorter rotation intervals and stricter audit trails.

**SRE**: Emergency rotation—triggered by an incident, not a schedule—should use the exact same automation path as normal rotation, just invoked immediately. If you only automate scheduled rotation, you'll be doing manual rotation under pressure when it matters most. The emergency case is where automation pays off hardest.

### When to Reach For This

If you're using a secrets manager that supports automatic rotation (most do now), enable it. The main engineering cost is making your services rotation-aware: re-fetch on auth failure, respect TTLs, don't assume a cached credential is permanently valid. That investment pays off both in the routine case and when you need to rotate fast.

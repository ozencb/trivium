---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Secrets management is the discipline of storing, distributing, and rotating credentials (API keys, database passwords, TLS certs, tokens) in a way that prevents accidental exposure while still making them available to the systems that need them. The core problem it solves: plaintext secrets in env files, CI configs, or git history are a persistent, low-effort attack surface.

## Core Mechanism

The fundamental shift is from *ambient* secrets to *dynamic, audited access*. Instead of a service having a static password baked into its config, it authenticates to a secrets store (Vault, AWS Secrets Manager, GCP Secret Manager) using its own identity — an IAM role, a Kubernetes service account, a signed JWT — and receives a short-lived credential. The secret itself travels over the wire only when needed, lives in memory, and expires.

This separates two concerns: *who can get the secret* (access policy) and *what the secret is* (the credential). Both are now centrally auditable.

The other key mechanism is **secret rotation**. When secrets have TTLs and are dynamically issued, rotation stops being a painful manual operation and becomes the default. A compromised credential expires on its own; rotating becomes a no-op from the application's perspective.

## Mental Model

Think of it like a valet stand vs. keeping your car keys in the lobby. With env-var secrets, you've left the keys in the lobby — anyone who walks through (compromised container, leaked logs, careless `env` output) has them. With secrets management, there's a valet who checks your identity, hands you the keys briefly, logs the transaction, and the keys expire if you don't return them.

## Practical Scenarios

**Backend:** Your service needs a database password. Instead of injecting `DB_PASSWORD=abc123` into the environment at deploy time, the service authenticates via its Kubernetes service account, calls Vault, gets a dynamically generated Postgres credential with a 1-hour TTL. If the pod is compromised, the blast radius is bounded.

**SRE:** Incident response gets cleaner. When a credential leaks, you revoke it in one place — the secrets store — rather than hunting down every deployment that might hold a copy. Audit logs show exactly which service called for what secret and when, which is invaluable during post-mortems.

**DevOps:** CI/CD pipelines are a major secrets exposure vector. Instead of storing `AWS_SECRET_ACCESS_KEY` as a CI variable (often readable by anyone with repo access), your pipeline authenticates via OIDC to AWS directly, receiving short-lived credentials scoped to exactly what that job needs. No static secrets exist to leak.

The integration point with Zero-Trust is direct: secrets management is how you implement "never trust, always verify" for non-human identities. Every service proves who it is before it gets the credential, every time.

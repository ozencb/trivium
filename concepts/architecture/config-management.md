---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Config Management

Config management is the practice of separating everything that varies between deployments from your artifact itself — so the same binary or container image runs in dev, staging, and prod, with environment-specific behavior injected at runtime rather than baked in at build time. The payoff is a real promotion pipeline: build once, promote the artifact, swap the config layer.

### The Core Mechanism

Your app is a function. Config is its input. The same binary + different inputs = different runtime behavior. "Config" means anything that varies across environments: database URLs, service discovery endpoints, timeouts, log levels, resource limits. The canonical injection mechanisms are environment variables (12-factor), mounted config files (Kubernetes ConfigMaps/Secrets), and config services (AWS AppConfig, HashiCorp Consul, GCP Runtime Config).

The escalation path matters. Env vars work fine up to ~20 variables per service. Beyond that, you want structured config with versioning, history, and rollback — a config service handles this. The config service also enables live reloads: change a value, the running process picks it up without restart.

### Concrete Example

A Kubernetes deployment ships the same Docker image to staging and prod. The staging ConfigMap sets `DB_HOST=staging-db.internal`, `LOG_LEVEL=debug`, `REPLICA_COUNT=1`. The prod ConfigMap sets `DB_HOST=prod-db.internal`, `LOG_LEVEL=warn`, `REPLICA_COUNT=10`. One image, two behaviors, zero rebuild. This is what makes canary deploys possible — you promote the image, and the config layer stays environment-local.

### Role-Specific Patterns

**Backend**: The subtle failure mode is implicit config — defaults hardcoded in application logic that silently override what you set in the environment. Always make config explicit with a config struct loaded at startup, logged at startup (minus secrets), and validated before the app accepts traffic.

**SRE**: Config drift causes a whole class of incident. Two pods of the same service running different config versions because someone patched one manually produces bugs that look like flakiness. Config management is how you get the audit trail: what changed, when, and who.

**DevOps**: Config is the seam between your artifact pipeline and your environment pipeline. The build system owns the artifact; the config system owns the parameters. Keeping these separate is what makes environment promotion cheap and repeatable.

**Fullstack**: Frontend apps have the same problem — API base URLs, analytics keys, OAuth client IDs. Building per environment breaks promotion. The right pattern is runtime injection: a `/config` endpoint the app fetches at load time, or server-side rendering that injects config into the initial HTML.

### What This Unlocks

Feature Flags are config that gates behavior, refreshed without deploy. Secrets Management is config with stricter access control, encryption at rest, and rotation — conceptually just sensitive config with a different trust boundary. Understanding config management as a system (not just "use env vars") is what lets you reason about both.

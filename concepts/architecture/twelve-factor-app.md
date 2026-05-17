---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Twelve-Factor App

A methodology for building cloud-native applications that can deploy cleanly across environments without manual configuration or tight coupling to infrastructure. The core insight: most deployment headaches come from apps that know too much about where they're running.

### The Core Idea

Traditional apps often embed assumptions about their environment — database URLs hardcoded in config files, sessions stored on local disk, logs written to `/var/log/app.log`. These work fine on a single server you manage personally. They break when you try to scale horizontally, run multiple environments, or let a platform like Kubernetes or Heroku manage deployment.

The twelve factors are a set of constraints that force you to externalize those assumptions. The three that actually matter most in practice:

**Config lives in environment variables.** Not config files checked into the repo, not a `config/production.yml`. Environment variables because they're naturally per-environment, never accidentally committed, and every deployment platform natively supports them. The smell: if you can't open-source your codebase without scrubbing secrets first, you're violating this.

**Processes are stateless and share nothing.** Any data that needs to persist between requests goes to a backing service — a database, Redis, S3. The process itself holds nothing. This is what makes horizontal scaling trivial: spin up ten instances, kill any of them, it doesn't matter. The smell: storing uploaded files on the local filesystem, or using sticky sessions.

**Disposability — fast startup, graceful shutdown.** Processes should start in seconds and handle `SIGTERM` cleanly. This is what lets a platform restart your app safely during deploys, scale events, or hardware failures.

### Concrete Example

Imagine your app reads `DATABASE_URL` from `os.environ` rather than `config/database.yml`. Now your CI environment, staging, and production all run the same binary — just with different env vars injected. No environment-specific code paths, no "works on staging, broken in prod."

### Why It Matters by Role

**Backend:** Designing a new service? Starting twelve-factor means you're building something your platform can manage without babysitting. Config changes don't require redeploys; scaling doesn't require redesign.

**SRE:** An app violating factor VI (stateful processes) is one you can't safely restart without coordination. That's toil. Twelve-factor apps are intrinsically more operable.

**DevOps:** Twelve-factor apps map cleanly to Kubernetes primitives — ConfigMaps for config, StatefulSets only when genuinely needed, rolling restarts that actually work. When an app fights these, it's usually violating one of the factors.

**Fullstack:** The "config in env vars" factor directly shapes how you structure `.env` files locally and how you wire up deployment secrets — it's not just backend concern.

### In Design Discussions

Senior engineers use this as a checklist when reviewing architecture. "Where does session state live?" and "How does this process handle SIGTERM?" are twelve-factor questions. Knowing the vocabulary lets you name the tradeoff precisely rather than describing it from first principles each time.

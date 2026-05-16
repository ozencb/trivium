---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Twelve-Factor App

A methodology for building software that runs reliably as a service — whether on your laptop, a VM, or a Kubernetes cluster — without heroic ops effort. It emerged from Heroku engineers documenting what made applications actually deployable at scale.

### The Core Idea

Most deployment pain comes from hidden coupling: between config and code, between a process and the machine it runs on, between services and how they're wired together. The twelve factors are a set of constraints that eliminate that coupling systematically.

The factors group into a few themes:

**Codebase and dependencies** — one repo per app, all dependencies declared explicitly (no "oh you need libxml2 installed globally"). This means `requirements.txt`, `package.json`, `go.mod` — not just "it works on my machine."

**Config** — everything that differs between environments (dev/staging/prod) lives in environment variables, not in code or config files committed to the repo. No `if env == "production"` branches, no hardcoded credentials.

**Processes and state** — processes are stateless and share nothing. Any persistent data goes to a backing service (database, cache). This is why you can run 10 instances of a factor-compliant app without coordination — they're interchangeable.

**Backing services** — databases, queues, SMTP servers are attached resources, referenced by URL in config. Swapping your local Postgres for RDS is a config change, not a code change.

**Build/release/run separation** — you build an artifact once, release it by combining it with config, and run it. No modifying code on production servers.

**Port binding** — the app exports its own HTTP server rather than relying on a web server injection (Apache, nginx) to activate it. You run `./app` and it listens on a port.

**Logs as streams** — the app writes to stdout/stderr, never manages log files. The infrastructure routes them wherever they need to go.

### Mental Model

Think of each factor as a seam: a place where concerns are separated so that each piece can be swapped independently. Config is swappable without redeployment. Processes are swappable without data loss. Services are swappable without code changes.

### Practical Angles

**Backend**: Factor III (config) directly governs how you handle database credentials and feature flags. If your app reads from a `.env` file that's gitignored, you're halfway there but not fully — env vars should be set by the platform, not a file you manage.

**SRE**: Factors VI (stateless processes) and XI (logs as streams) are load-balancing and observability preconditions. If processes hold local state, you can't kill and replace them freely. If logs are files, you need agents; if they're stdout, you get it for free.

**DevOps**: Factor V (build/release/run) maps directly to CI/CD pipeline design. The discipline of building once and promoting the same artifact through environments is the twelve-factor version of "works on my machine" discipline.

**Fullstack**: Factor IV (backing services) keeps your frontend-serving layer decoupled from your data layer — the API URL is config, not hardcoded, which is why environment-specific builds aren't necessary.

The full spec is at 12factor.net, but the 80% value is: stateless processes, config in env vars, dependencies declared, logs to stdout.

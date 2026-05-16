---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Config Management is the discipline of separating runtime configuration from code so the same artifact can run correctly in any environment. The "why" is operational: a Docker image that embeds prod credentials or hardcoded hostnames forces you to rebuild for every environment, breaking the entire premise of portable deployments.

## The Core Mechanism

You already know Twelve-Factor's "store config in the environment." Config Management is what happens when you take that seriously at scale. The fundamental shift is treating config as a *first-class artifact*: versioned, validated, audited, and delivered to processes without being baked into them.

There are three main patterns:

**Environment injection** — the classic approach. Config lives in env vars set by the platform (Docker, systemd, your CI). The app reads `os.environ`. Simple, but doesn't handle dynamic changes or large config sets well.

**Mounted config files** — Kubernetes ConfigMaps are the canonical example. Config is stored as a cluster resource and mounted into the pod's filesystem at runtime. The app reads a file, the platform manages what's in it. This handles larger config and lets you version it in Git alongside your manifests.

**Config server / distributed KV** — tools like Consul, etcd, or AWS Parameter Store act as a live config store. The app (or sidecar) polls or watches for changes, enabling *dynamic reconfiguration* without restarts. This is where Config Management starts unlocking Feature Flags.

## Mental Model

Think of your application as a pure function: `f(code, config) → behavior`. Config Management is everything that ensures the right values reach `f` for a given environment, at the right time, with a change history you can reason about.

The hard part isn't reading an env var — it's knowing which values changed when the on-call incident happened, and why staging behaves differently than prod despite running the "same" image.

## Where This Shows Up

**Backend**: Database pool sizes, downstream service URLs, timeouts, and retry counts are all config. Hardcoding them is a rebuild every time you tune for production load.

**SRE**: Circuit breaker thresholds, rate limits, and canary traffic weights are things you want to change *under pressure*, not via a deployment pipeline. A config server lets you do that safely.

**DevOps**: Helm values files are config management for Kubernetes. You maintain `values-dev.yaml`, `values-prod.yaml` and let the chart parameterize the difference. ConfigMaps and Secrets are the runtime delivery mechanism.

**Fullstack**: API base URLs, CDN origins, and feature flag defaults vary by environment. Config Management prevents the classic bug where someone hardcoded `api.staging.example.com` and it went to prod.

---

The boundary worth keeping in mind: Config Management handles *non-sensitive* configuration. Once a value needs to be secret (credentials, API keys), it crosses into Secrets Management — which layers encryption and access control on top of the same delivery patterns.

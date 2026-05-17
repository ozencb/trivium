---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CI/CD Pipelines

Every codebase has an implicit release process — someone builds artifacts, runs tests, maybe SSHs into a server. CI/CD makes that process explicit, deterministic, and automatic: a commit triggers a graph of jobs that mirrors what humans *would* do, but encoded as config checked into the repo alongside the code it governs.

**The core mechanism**

A pipeline is a DAG of stages (jobs) with dependency constraints. Each job runs in a clean, ephemeral environment — a container or VM — which is the key invariant: no local state bleeds between runs. The pipeline is triggered by an event (push, PR, tag), and stages execute in order, passing artifacts forward. If any stage fails, the pipeline stops and the commit is blocked from progressing further.

The "CI" half (Continuous Integration) runs on every branch push: compile, lint, test. The goal is to make integration failures cheap by catching them immediately rather than at merge time. The "CD" half (Continuous Delivery/Deployment) extends this to actually ship: build a deployable artifact, push it to a registry, then deploy — either automatically (deployment) or gate behind a manual approval (delivery).

**Mental model**

Think of it as a turnstile: every commit must pass through the same gates in the same order. The gates are defined in version control, so the definition of "releasable" is auditable, diffable, and reviewable like any other code change.

**Practical scenarios**

*Backend:* A Django service pipeline might run `pytest` against a throwaway Postgres container, then build a Docker image tagged with the commit SHA, push to ECR, and trigger a rolling deploy to ECS — automatically wiring into the blue-green deployment infrastructure you already have.

*Frontend:* Compile TypeScript, run Jest, run Playwright against a preview deployment, then push static assets to S3/CDN with cache invalidation. The preview URL per-PR becomes your manual QA step before merge.

*DevOps:* Pipelines apply to infrastructure too. Terraform `plan` output as a PR comment, then `apply` gated on approval — same turnstile model, applied to infra changes.

*Fullstack:* Monorepo pipelines use path-based triggers: changes under `packages/api/` only run backend jobs; changes under `packages/web/` only run frontend jobs. Tools like Nx or Turborepo add dependency-aware caching so unchanged packages don't rebuild.

*SRE:* Pipelines emit deployment metadata — who deployed, what SHA, what time — which feeds into your incident timeline. A failed canary can automatically trigger a rollback stage rather than requiring a human to notice and intervene.

**Common pitfalls**

Flaky tests kill trust in pipelines faster than anything else — engineers start re-running failures without investigating, which defeats the whole point. Treat a flaky test as a P1. The other failure mode is pipeline sprawl: dozens of disconnected YAML files with duplicated logic and no shared secrets management, which makes the pipeline itself a maintenance burden rather than a force multiplier.

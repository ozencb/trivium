---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Artifact Registries

A build artifact is only useful if you can trust that what you tested is what you deployed. Artifact registries enforce that guarantee by being the single source of truth for versioned build outputs—container images, npm packages, Maven JARs, Helm charts—between the moment something is built and the moment it runs in production.

**The core mechanism**

The key insight is immutability combined with promotion. When your CI pipeline builds a Docker image tagged `my-service:sha-a3f9c2`, that image is pushed to the registry *once* and never mutated. Deploying to staging pulls that exact digest. Deploying to production pulls the same digest. You're not rebuilding from source for each environment—you're moving a frozen artifact through a pipeline. This eliminates entire categories of "works in staging, breaks in prod" bugs caused by environmental differences in build tooling, dependency resolution, or secret injection during build.

Promotion workflows sit on top of this: an artifact lives in a `dev` repository, gets scanned for vulnerabilities and validated, then a promotion step copies it to `staging`, then to `prod`. The registry tracks the chain of custody—who promoted what, when, and why.

**Concrete mental model**

Think of a registry like a warehouse with strict inventory control. CI is the factory that produces goods and ships them to the warehouse with a batch number. QA inspects the batch. Ops pulls that batch number for deployment. Nobody re-manufactures the goods when they need them—they pull from the warehouse. The alternative (rebuilding per environment) is like baking a new cake for each guest using slightly different flour and calling it the same recipe.

**Where this matters in practice**

*For DevOps:* Registries are where security scanning integrates cleanly. Tools like Trivy or Clair run at push time against a fixed artifact, not against ephemeral build contexts. You can enforce policies ("no deployment if HIGH CVEs unfixed") before anything reaches prod. Retention policies and storage costs become real concerns at scale—you'll want to prune old images aggressively or you'll accumulate terabytes.

*For backend engineers:* If you're packaging services as containers or publishing internal libraries, the registry is where versioning discipline lives. Floating tags like `latest` are a footgun—two deployments a week apart may pull different images. Pin to digest or immutable semver tags. Also: private registries matter for proprietary code; leaking an internal package to a public registry is a real incident pattern.

**Common pitfalls**

- Overwriting tags instead of using immutable digests, defeating the entire guarantee
- No cleanup policy, leading to registry bloat that becomes a budget problem
- Treating the registry as a build cache rather than a release artifact store—those are different concerns

If you're already doing CI/CD, the registry is the missing link that makes environment promotion actually reproducible.
